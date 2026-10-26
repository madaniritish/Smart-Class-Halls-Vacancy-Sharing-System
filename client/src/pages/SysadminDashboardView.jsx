import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';

const SysadminDashboardView = () => {
    const { user } = useContext(AuthContext);
    const [activeNav, setActiveNav] = useState(0);

    const [roleRequests, setRoleRequests] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [venues, setVenues] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [stats, setStats] = useState({
        totalVenues: 0,
        totalBookings: 0,
        pendingBookings: 0,
        pendingRoleRequests: 0,
        activeUsers: 0,
        occupancyRate: 50
    });

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [searchUser, setSearchUser] = useState('');
    const [bookingFilter, setBookingFilter] = useState('all');
    const [searchBooking, setSearchBooking] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    const fetchAllData = async () => {
        try {
            const [reqRes, usersRes, venuesRes, statsRes, bRes] = await Promise.all([
                api.get('/admin/role-requests').catch(() => ({ data: [] })),
                api.get('/admin/users').catch(() => ({ data: [] })),
                api.get('/venues').catch(() => ({ data: [] })),
                api.get('/admin/stats').catch(() => ({ data: {} })),
                api.get('/bookings').catch(() => ({ data: [] }))
            ]);

            setRoleRequests(reqRes.data || []);
            setUsersList(usersRes.data || []);
            setVenues(venuesRes.data || []);
            setBookings(bRes.data || []);
            if (statsRes.data && Object.keys(statsRes.data).length > 0) {
                setStats(statsRes.data);
            }
        } catch (err) {
            console.error('Sysadmin fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // Approve Role Request
    const handleApproveRole = async (targetUserId, requestedRole) => {
        setActionLoading(targetUserId);
        try {
            await api.put(`/admin/role-requests/${targetUserId}`, {
                action: 'approve',
                approvedRole: requestedRole
            });
            showToast(`Role ${requestedRole.toUpperCase()} approved! User now has access to the role dashboard.`, 'success');
            fetchAllData();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to approve role request.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    // Reject Role Request
    const handleRejectRole = async (targetUserId) => {
        const reason = window.prompt('Please enter the reason for rejecting this role application:');
        if (reason === null) return;

        setActionLoading(targetUserId);
        try {
            await api.put(`/admin/role-requests/${targetUserId}`, {
                action: 'reject',
                remarks: reason.trim() || 'Role request declined by Administrator.'
            });
            showToast('Role request rejected.', 'info');
            fetchAllData();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to reject role request.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    // Filter calculations
    const pendingReqCount = roleRequests.length;
    const pendingBookings = bookings.filter(b => b.status === 'pending');
    const approvedBookings = bookings.filter(b => b.status === 'approved');

    // Filter users list by search
    const filteredUsers = usersList.filter(u => {
        const q = searchUser.toLowerCase();
        return (u.name || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (u.username || '').toLowerCase().includes(q) ||
            (u.role || '').toLowerCase().includes(q) ||
            (u.branch || '').toLowerCase().includes(q);
    });

    const filteredBookings = bookings.filter(b => {
        if (bookingFilter === 'pending' && b.status !== 'pending') return false;
        if (bookingFilter === 'approved' && b.status !== 'approved') return false;
        if (searchBooking.trim()) {
            const q = searchBooking.toLowerCase();
            const applicant = (b.user?.name || b.user?.username || '').toLowerCase();
            const venueName = (b.venue_id?.name || '').toLowerCase();
            const purpose = (b.purpose || '').toLowerCase();
            return applicant.includes(q) || venueName.includes(q) || purpose.includes(q);
        }
        return true;
    });

    const NAV_ITEMS = [
        { label: 'Role Requests', icon: '🛡️', badge: pendingReqCount ? String(pendingReqCount) : null },
        { label: 'User Directory', icon: '👥' },
        { label: 'Campus Venues', icon: '🏛️' },
        { label: 'Platform Analytics', icon: '⚡' },
        { label: 'All Bookings Audit', icon: '📋', badge: bookings.length ? String(bookings.length) : null }
    ];

    return (
        <DashboardLayout role="sysadmin" navItems={NAV_ITEMS} activeNav={activeNav} onNavClick={setActiveNav}>
            <div className="space-y-6">

                {/* Toast Alert */}
                {toast.show && (
                    <div className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between shadow-sm animate-fade-in ${
                        toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
                    }`}>
                        <div className="flex items-center gap-2">
                            <span>{toast.type === 'success' ? '✓' : '⚠️'}</span>
                            <span>{toast.message}</span>
                        </div>
                        <button type="button" onClick={() => setToast({ show: false, message: '', type: 'success' })} className="text-slate-400">✕</button>
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-6 rounded-2xl border border-blue-100 shadow-xs">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">System Administration • Root Console</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            CampusFlow Enterprise Management • Role Authorizations, User Accounts &amp; Platform Infrastructure
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            Superuser Authority
                        </span>
                    </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div
                        onClick={() => setActiveNav(0)}
                        className={`p-5 rounded-2xl bg-white border cursor-pointer transition-all shadow-xs ${
                            activeNav === 0 ? 'border-blue-500 ring-2 ring-blue-100' : 'border-blue-100 hover:border-blue-300'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pending Role Requests</span>
                            <span className="text-base">🛡️</span>
                        </div>
                        <div className="text-3xl font-black text-blue-600 mt-2">{pendingReqCount}</div>
                        <div className="text-xs text-blue-700 font-medium mt-1">Users awaiting role clearance</div>
                    </div>

                    <div
                        onClick={() => setActiveNav(1)}
                        className={`p-5 rounded-2xl bg-white border cursor-pointer transition-all shadow-xs ${
                            activeNav === 1 ? 'border-blue-500 ring-2 ring-blue-100' : 'border-blue-100 hover:border-blue-300'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Campus Accounts</span>
                            <span className="text-base">👥</span>
                        </div>
                        <div className="text-3xl font-black text-slate-800 mt-2">{stats.activeUsers || usersList.length}</div>
                        <div className="text-xs text-slate-400 font-medium mt-1">Registered users</div>
                    </div>

                    <div
                        onClick={() => setActiveNav(2)}
                        className={`p-5 rounded-2xl bg-white border cursor-pointer transition-all shadow-xs ${
                            activeNav === 2 ? 'border-blue-500 ring-2 ring-blue-100' : 'border-blue-100 hover:border-blue-300'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Registered Venues</span>
                            <span className="text-base">🏛️</span>
                        </div>
                        <div className="text-3xl font-black text-slate-800 mt-2">{stats.totalVenues || venues.length}</div>
                        <div className="text-xs text-slate-400 font-medium mt-1">Classrooms &amp; Auditoriums</div>
                    </div>

                    <div
                        onClick={() => setActiveNav(3)}
                        className={`p-5 rounded-2xl bg-white border cursor-pointer transition-all shadow-xs ${
                            activeNav === 3 ? 'border-blue-500 ring-2 ring-blue-100' : 'border-blue-100 hover:border-blue-300'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Platform Occupancy</span>
                            <span className="text-base">⚡</span>
                        </div>
                        <div className="text-3xl font-black text-emerald-600 mt-2">{stats.occupancyRate || 68}%</div>
                        <div className="text-xs text-emerald-700 font-medium mt-1">Room utilization rate</div>
                    </div>
                </div>

                {/* Tab Switcher Bar */}
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
                    {NAV_ITEMS.map((item, idx) => {
                        const isActive = activeNav === idx;
                        return (
                            <button
                                key={item.label}
                                type="button"
                                onClick={() => setActiveNav(idx)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    isActive
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200'
                                }`}
                            >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                                {item.badge && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                                        isActive ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Section 0: Role Verification & Authorization Applications (Primary Sysadmin Responsibility) */}
                {activeNav === 0 && (
                    <div className="p-6 sm:p-7 rounded-2xl bg-white border border-blue-100 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h2 className="text-lg font-extrabold text-blue-950 flex items-center gap-2">
                                    <span>🛡️</span> Role Verification &amp; Authorization Applications
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Applications submitted by users requesting elevated roles (Faculty, Class Representative, Event Organizer)
                                </p>
                            </div>
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                {pendingReqCount} Actionable Requests
                            </span>
                        </div>

                        {loading ? (
                            <div className="py-12 text-center text-slate-400 text-sm">Loading applications...</div>
                        ) : roleRequests.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-sm bg-blue-50/30 rounded-xl border border-dashed border-blue-200">
                                🎉 No pending role requests awaiting administrator clearance. All users are verified!
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-blue-50/70 text-slate-600 uppercase font-bold border-b border-blue-100">
                                        <tr>
                                            <th className="p-3.5">User Details</th>
                                            <th className="p-3.5">Department &amp; Class</th>
                                            <th className="p-3.5">ID / Roll No</th>
                                            <th className="p-3.5">Requested Role</th>
                                            <th className="p-3.5">Purpose / Justification</th>
                                            <th className="p-3.5 text-right">Decision</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {roleRequests.map((reqUser) => {
                                            const rInfo = reqUser.roleRequest || {};
                                            const isThisLoading = actionLoading === reqUser._id;

                                            return (
                                                <tr key={reqUser._id} className="hover:bg-blue-50/30 transition-colors">
                                                    <td className="p-3.5">
                                                        <div className="flex items-center gap-2.5">
                                                            {reqUser.avatar ? (
                                                                <img src={reqUser.avatar} alt={reqUser.name} className="w-8 h-8 rounded-full border border-blue-200" />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-300 text-blue-700 font-bold flex items-center justify-center text-xs">
                                                                    {(reqUser.name || reqUser.email || 'U')[0].toUpperCase()}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="font-bold text-slate-900">{reqUser.name}</div>
                                                                <div className="text-slate-400 text-[11px] font-mono">{reqUser.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3.5">
                                                        <div className="font-semibold text-slate-800">{rInfo.department || reqUser.branch}</div>
                                                        <div className="text-[11px] text-slate-500">
                                                            {rInfo.academicYear} • {rInfo.section}
                                                        </div>
                                                    </td>
                                                    <td className="p-3.5 font-mono text-slate-800 font-semibold">
                                                        {rInfo.idNumber || reqUser.studentRollNumber || reqUser.employeeId || 'N/A'}
                                                    </td>
                                                    <td className="p-3.5">
                                                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200 capitalize">
                                                            {rInfo.requestedRole?.replace('_', ' ') || 'Faculty'}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5 max-w-xs text-slate-600">
                                                        {rInfo.reason || 'Requested campus dashboard authorization.'}
                                                    </td>
                                                    <td className="p-3.5 text-right space-x-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleApproveRole(reqUser._id, rInfo.requestedRole)}
                                                            disabled={isThisLoading}
                                                            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all"
                                                        >
                                                            {isThisLoading ? '...' : 'Approve Role'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRejectRole(reqUser._id)}
                                                            disabled={isThisLoading}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-all"
                                                        >
                                                            Decline
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Section 1: User Directory & Accounts */}
                {activeNav === 1 && (
                    <div className="p-6 sm:p-7 rounded-2xl bg-white border border-blue-100 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                            <div>
                                <h2 className="text-lg font-extrabold text-blue-950 flex items-center gap-2">
                                    <span>👥</span> Institutional User Accounts &amp; Authorized Roles
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">Directly verified credentials from MongoDB</p>
                            </div>
                            <div className="w-full sm:w-64">
                                <input
                                    type="text"
                                    value={searchUser}
                                    onChange={(e) => setSearchUser(e.target.value)}
                                    placeholder="Search by name, role, email..."
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="p-3.5">Name / Username</th>
                                        <th className="p-3.5">Email</th>
                                        <th className="p-3.5">Assigned Role</th>
                                        <th className="p-3.5">Department</th>
                                        <th className="p-3.5">Auth Type</th>
                                        <th className="p-3.5">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {filteredUsers.slice(0, 15).map((u) => (
                                        <tr key={u._id} className="hover:bg-blue-50/20 transition-colors">
                                            <td className="p-3.5 font-bold text-slate-900">{u.name || u.username}</td>
                                            <td className="p-3.5 font-mono text-slate-500">{u.email || `${u.username}@campusflow.edu`}</td>
                                            <td className="p-3.5">
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                                                    {u.role?.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-3.5 font-medium">{u.branch || 'General'}</td>
                                            <td className="p-3.5 text-slate-500 capitalize">{u.authProvider || 'Local'}</td>
                                            <td className="p-3.5">
                                                <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Section 2: Registered Venues Directory */}
                {activeNav === 2 && (
                    <div className="p-6 sm:p-7 rounded-2xl bg-white border border-blue-100 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h2 className="text-lg font-extrabold text-blue-950 flex items-center gap-2">
                                    <span>🏛️</span> Campus Venues &amp; Physical Infrastructure
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">All registered classrooms, labs, and seminar halls across departments</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {venues.map((v) => (
                                <div key={v._id} className="p-4 rounded-xl border border-blue-100 bg-blue-50/20 hover:border-blue-300 transition-all space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-slate-900 text-sm">{v.name}</h3>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                            {v.type?.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-600">
                                        Branch: <span className="font-semibold text-slate-800">{v.branch || 'General'}</span> • Capacity: <span className="font-bold text-slate-800">{v.capacity} seats</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                        Weekly Schedule: {v.weekly_schedule?.length ? `${v.weekly_schedule.length} scheduled lectures` : 'Open access'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Section 3: Platform Analytics */}
                {activeNav === 3 && (
                    <div className="p-6 sm:p-7 rounded-2xl bg-white border border-blue-100 shadow-xs space-y-6">
                        <div>
                            <h2 className="text-lg font-extrabold text-blue-950 flex items-center gap-2">
                                <span>⚡</span> Platform Operations &amp; Allocation Analytics
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">Real-time breakdown of campus venue occupancy, reservations, and verified roles</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-5 rounded-xl border border-blue-100 bg-blue-50/30">
                                <div className="text-xs text-slate-500 font-bold uppercase">Total Bookings Logged</div>
                                <div className="text-2xl font-black text-blue-900 mt-1">{stats.totalBookings || bookings.length}</div>
                                <div className="text-xs text-slate-500 mt-1">Across classrooms &amp; seminar halls</div>
                            </div>
                            <div className="p-5 rounded-xl border border-emerald-100 bg-emerald-50/30">
                                <div className="text-xs text-emerald-800 font-bold uppercase">Approved Allocations</div>
                                <div className="text-2xl font-black text-emerald-700 mt-1">{approvedBookings.length}</div>
                                <div className="text-xs text-emerald-600 mt-1">Cleared by venue administrators</div>
                            </div>
                            <div className="p-5 rounded-xl border border-amber-100 bg-amber-50/30">
                                <div className="text-xs text-amber-800 font-bold uppercase">Pending in Queue</div>
                                <div className="text-2xl font-black text-amber-700 mt-1">{pendingBookings.length}</div>
                                <div className="text-xs text-amber-600 mt-1">Awaiting classroom/seminar admin decision</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Section 4: All Bookings Audit Overview (Global Institutional Oversight) */}
                {activeNav === 4 && (
                    <div className="p-6 sm:p-7 rounded-2xl bg-white border border-blue-100 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                            <div>
                                <h2 className="text-lg font-extrabold text-blue-950 flex items-center gap-2">
                                    <span>📋</span> Global Venue Bookings Audit
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    System-wide audit trail of all room and hall reservations across departments
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={searchBooking}
                                    onChange={(e) => setSearchBooking(e.target.value)}
                                    placeholder="Search bookings..."
                                    className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="p-3.5">Applicant</th>
                                        <th className="p-3.5">Venue</th>
                                        <th className="p-3.5">Purpose / Session</th>
                                        <th className="p-3.5">Date &amp; Time</th>
                                        <th className="p-3.5">Status</th>
                                        <th className="p-3.5">Approver Authority</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {filteredBookings.slice(0, 20).map((b) => {
                                        const vName = b.venue_id?.name || 'Venue';
                                        const applicant = b.user?.name || b.user?.username || 'Applicant';
                                        const isClassroom = b.venue_id?.type === 'classroom' || b.venue_id?.type === 'lab';
                                        const assignedRole = isClassroom ? 'Classroom Admin (Ramesh Rao)' : 'Seminar Admin';

                                        return (
                                            <tr key={b._id} className="hover:bg-blue-50/20 transition-colors">
                                                <td className="p-3.5 font-bold text-slate-900">{applicant}</td>
                                                <td className="p-3.5 font-semibold text-blue-900">{vName}</td>
                                                <td className="p-3.5 max-w-xs truncate">{b.purpose}</td>
                                                <td className="p-3.5 text-slate-600">
                                                    {new Date(b.date).toLocaleDateString()} ({b.start_time} - {b.end_time})
                                                </td>
                                                <td className="p-3.5">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                                        b.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                                        b.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {b.status}
                                                    </span>
                                                </td>
                                                <td className="p-3.5 text-slate-500 font-medium">{assignedRole}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>
        </DashboardLayout>
    );
};

export default SysadminDashboardView;
