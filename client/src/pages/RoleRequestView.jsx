import { useState, useContext, useEffect } from 'react';
import { AuthContext, getRoleRedirect } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const ROLE_OPTIONS = [
    {
        id: 'faculty',
        title: 'Faculty Member',
        icon: '👨‍🏫',
        desc: 'Reserve classrooms for scheduled lectures, extra classes, and view department timetables.'
    },
    {
        id: 'cr',
        title: 'Class Representative (CR)',
        icon: '🎓',
        desc: 'Authorized student representative requesting classrooms for batch extra classes & tutorials.'
    },
    {
        id: 'event_organizer',
        title: 'Event Organizer',
        icon: '📢',
        desc: 'Club leads and society coordinators requesting seminar halls and auditoriums for events.'
    },
    {
        id: 'classroom_admin',
        title: 'Classroom Administrator',
        icon: '🏛️',
        desc: 'Department authority reviewing, approving, and overseeing classroom reservations.'
    },
    {
        id: 'seminar_admin',
        title: 'Seminar Hall Administrator',
        icon: '🎭',
        desc: 'Campus authority managing major auditorium and seminar hall bookings.'
    }
];

const DEPARTMENTS = [
    'CSE', 'ECE', 'AIDS', 'MECH', 'CIVIL', 'General'
];

const CLASS_YEARS = [
    '1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate / M.Tech', 'Faculty / Staff'
];

const RoleRequestView = () => {
    const { user, refreshUser, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const [requestedRole, setRequestedRole] = useState(user?.roleRequest?.requestedRole || 'faculty');
    const [department, setDepartment] = useState(user?.roleRequest?.department || user?.branch || 'CSE');
    const [academicYear, setAcademicYear] = useState(user?.roleRequest?.academicYear || '3rd Year');
    const [section, setSection] = useState(user?.roleRequest?.section || 'Section A');
    const [idNumber, setIdNumber] = useState(user?.roleRequest?.idNumber || user?.studentRollNumber || user?.employeeId || '');
    const [reason, setReason] = useState(user?.roleRequest?.reason || '');

    const [loading, setLoading] = useState(false);
    const [statusChecking, setStatusChecking] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // If user already has an active privileged role (not student), redirect to their dashboard
    useEffect(() => {
        if (user && user.role && user.role !== 'student') {
            navigate(getRoleRedirect(user.role), { replace: true });
        }
    }, [user, navigate]);

    const reqStatus = user?.roleRequest?.status || 'none';

    const handleCheckStatus = async () => {
        setStatusChecking(true);
        setError('');
        setMessage('');
        try {
            const updated = await refreshUser();
            if (updated && updated.role && updated.role !== 'student') {
                setMessage(`Role granted: ${updated.role.toUpperCase()}! Redirecting to your dashboard...`);
                setTimeout(() => navigate(getRoleRedirect(updated.role)), 1200);
            } else if (updated?.roleRequest?.status === 'approved') {
                setMessage('Your request has been approved! Redirecting...');
                setTimeout(() => navigate(getRoleRedirect(updated.role)), 1200);
            } else {
                setMessage('Request is currently under review by the Administrator.');
            }
        } catch (err) {
            setError('Could not verify status. Please try again.');
        } finally {
            setStatusChecking(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!idNumber.trim()) {
            return setError('Please provide your University Roll Number or Faculty ID.');
        }

        setLoading(true);
        try {
            const res = await api.post('/users/request-role', {
                requestedRole,
                department,
                academicYear,
                section,
                idNumber: idNumber.trim(),
                reason: reason.trim()
            });

            await refreshUser();
            setMessage(res.data.message || 'Request submitted successfully.');
            setIsEditing(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit role request.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-sky-50 text-slate-800 antialiased flex flex-col justify-between">
            {/* Top Navigation */}
            <header className="bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-sm sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shadow-md">
                            CF
                        </div>
                        <div>
                            <span className="font-extrabold text-lg text-blue-900 tracking-tight">CampusFlow</span>
                            <span className="hidden sm:inline-block ml-2 text-xs text-slate-500 border-l border-slate-200 pl-2">
                                Identity &amp; Role Authorization
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            {user?.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-blue-200" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-300 text-blue-700 font-bold flex items-center justify-center text-xs">
                                    {(user?.name || user?.email || 'U')[0].toUpperCase()}
                                </div>
                            )}
                            <div className="hidden sm:block text-left text-xs">
                                <div className="font-semibold text-slate-800 truncate max-w-[130px]">{user?.name || user?.email}</div>
                                <div className="text-slate-500 text-[11px] truncate max-w-[130px]">{user?.email}</div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleSignOut}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-all ml-1 shadow-sm"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
                {/* Status Banners */}
                {message && (
                    <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-3 shadow-sm animate-fade-in">
                        <span className="text-xl">✅</span>
                        <span>{message}</span>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-3 shadow-sm animate-fade-in">
                        <span className="text-xl">⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* If user has a pending request and isn't editing, show status tracker */}
                {reqStatus === 'pending' && !isEditing ? (
                    <div className="bg-white rounded-2xl border border-blue-100 shadow-md p-6 sm:p-8 space-y-6 animate-fade-in">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 mb-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                                    <span>Verification Pending</span>
                                </div>
                                <h1 className="text-2xl font-black text-slate-900">Role Authorization Under Review</h1>
                                <p className="text-sm text-slate-500 mt-1">
                                    Your application has been received and queued for Administrator clearance.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleCheckStatus}
                                disabled={statusChecking}
                                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                {statusChecking ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Checking Status...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>🔄</span>
                                        <span>Check Verification Status</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Summary of Submitted Request */}
                        <div className="bg-blue-50/60 rounded-xl p-5 border border-blue-100 space-y-4">
                            <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Submitted Credentials</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                                <div className="p-3 bg-white rounded-lg border border-blue-100">
                                    <div className="text-slate-400 font-medium">Requested Role</div>
                                    <div className="text-sm font-bold text-blue-900 mt-0.5 capitalize">
                                        {user?.roleRequest?.requestedRole?.replace('_', ' ')}
                                    </div>
                                </div>
                                <div className="p-3 bg-white rounded-lg border border-blue-100">
                                    <div className="text-slate-400 font-medium">Department / Branch</div>
                                    <div className="text-sm font-bold text-slate-800 mt-0.5">
                                        {user?.roleRequest?.department}
                                    </div>
                                </div>
                                <div className="p-3 bg-white rounded-lg border border-blue-100">
                                    <div className="text-slate-400 font-medium">Class / Year &amp; Section</div>
                                    <div className="text-sm font-bold text-slate-800 mt-0.5">
                                        {user?.roleRequest?.academicYear} • {user?.roleRequest?.section}
                                    </div>
                                </div>
                                <div className="p-3 bg-white rounded-lg border border-blue-100">
                                    <div className="text-slate-400 font-medium">Roll No / Employee ID</div>
                                    <div className="text-sm font-bold text-slate-800 mt-0.5 font-mono">
                                        {user?.roleRequest?.idNumber}
                                    </div>
                                </div>
                                <div className="p-3 bg-white rounded-lg border border-blue-100 sm:col-span-2">
                                    <div className="text-slate-400 font-medium">Submitted On</div>
                                    <div className="text-sm font-bold text-slate-800 mt-0.5">
                                        {user?.roleRequest?.submittedAt ? new Date(user.roleRequest.submittedAt).toLocaleString() : 'Just now'}
                                    </div>
                                </div>
                            </div>

                            {user?.roleRequest?.reason && (
                                <div className="p-3 bg-white rounded-lg border border-blue-100 text-xs">
                                    <div className="text-slate-400 font-medium">Purpose / Justification</div>
                                    <div className="text-slate-700 mt-1">{user.roleRequest.reason}</div>
                                </div>
                            )}
                        </div>

                        {/* Notice & Edit Option */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                            <p className="text-xs text-slate-500">
                                Need to correct your information before review?
                            </p>
                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 rounded-lg text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                            >
                                Edit Application
                            </button>
                        </div>
                    </div>
                ) : (
                    /* The Role Application Form */
                    <div className="bg-white rounded-2xl border border-blue-100 shadow-md p-6 sm:p-8 space-y-6 animate-fade-in">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
                                <span>🏛️</span>
                                <span>Campusflow Identity Onboarding</span>
                            </div>
                            <h1 className="text-2xl font-black text-slate-900">Request Campus Role Authorization</h1>
                            <p className="text-sm text-slate-500 mt-1">
                                Complete your academic details to receive authorized access to classroom and hall management tools.
                            </p>
                        </div>

                        {reqStatus === 'rejected' && (
                            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 space-y-1">
                                <div className="font-bold">Previous Request Update:</div>
                                <div>{user?.roleRequest?.adminRemarks || 'Your previous request was not approved. Please revise your details and resubmit.'}</div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Role Selection Cards */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Select Your Desired Role *
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {ROLE_OPTIONS.map((opt) => {
                                        const isSelected = requestedRole === opt.id;
                                        return (
                                            <div
                                                key={opt.id}
                                                onClick={() => setRequestedRole(opt.id)}
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                    isSelected
                                                        ? 'border-blue-600 bg-blue-50/80 shadow-sm'
                                                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">{opt.icon}</span>
                                                    <span className="font-bold text-sm text-slate-900">{opt.title}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">{opt.desc}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Department and Class Year */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Academic Department *
                                    </label>
                                    <select
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        {DEPARTMENTS.map(d => (
                                            <option key={d} value={d}>Department of {d}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Class Year / Academic Level *
                                    </label>
                                    <select
                                        value={academicYear}
                                        onChange={(e) => setAcademicYear(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        {CLASS_YEARS.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Section and Roll / Employee ID */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Section / Division *
                                    </label>
                                    <input
                                        type="text"
                                        value={section}
                                        onChange={(e) => setSection(e.target.value)}
                                        placeholder="e.g. Section A, CSE-1"
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        University Roll No or Employee ID *
                                    </label>
                                    <input
                                        type="text"
                                        value={idNumber}
                                        onChange={(e) => setIdNumber(e.target.value)}
                                        placeholder="e.g. 23CS1052 or EMP4029"
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Justification / Notes */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Official Purpose &amp; Verification Details
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Briefly state your designation, club name, or purpose for requesting this role (e.g. Elected Class Representative for 3rd Year CSE-A, Faculty Advisor for IEEE Student Branch)."
                                    rows={3}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                {isEditing && (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="px-5 py-2.5 rounded-xl font-semibold text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-7 py-3 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Submitting Verification Request...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Submit Role Application</span>
                                            <span>→</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </main>

            {/* Simple Footer */}
            <footer className="text-center py-4 text-xs text-slate-400 border-t border-blue-50 bg-white/50">
                CampusFlow • Smart Class and Halls Vacancy Sharing System • Institutional Portal
            </footer>
        </div>
    );
};

export default RoleRequestView;
