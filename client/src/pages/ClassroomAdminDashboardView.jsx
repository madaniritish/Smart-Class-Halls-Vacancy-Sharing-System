import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';

const ClassroomAdminDashboardView = () => {
    const { user } = useContext(AuthContext);
    const [activeNav, setActiveNav] = useState(0);

    const [bookings, setBookings] = useState([]);
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    const fetchData = async () => {
        try {
            const [bRes, vRes] = await Promise.all([
                api.get('/bookings'),
                api.get('/venues')
            ]);
            // Filter classroom venues
            const crVenues = vRes.data.filter(v => v.type === 'classroom');
            setVenues(crVenues.length > 0 ? crVenues : vRes.data);
            setBookings(bRes.data || []);
        } catch (err) {
            console.error('Classroom Admin fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Handle Approve
    const handleApprove = async (bookingId) => {
        setActionLoading(bookingId);
        try {
            await api.put(`/bookings/${bookingId}/status`, { status: 'approved' });
            showToast('Classroom booking approved successfully!', 'success');
            fetchData();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to approve booking.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    // Handle Reject
    const handleReject = async (bookingId) => {
        const reason = window.prompt('Please provide the official reason for declining this request:');
        if (reason === null) return;
        if (!reason.trim()) {
            return showToast('A reason is required to reject a booking request.', 'error');
        }

        setActionLoading(bookingId);
        try {
            await api.put(`/bookings/${bookingId}/status`, {
                status: 'rejected',
                rejection_reason: reason.trim()
            });
            showToast('Booking request rejected.', 'info');
            fetchData();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to reject booking.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const pendingBookings = bookings.filter(b => b.status === 'pending');
    const approvedBookings = bookings.filter(b => b.status === 'approved');

    const NAV_ITEMS = [
        { label: 'Pending Approvals Queue', icon: '📥', badge: pendingBookings.length ? String(pendingBookings.length) : null },
        { label: 'Classroom Master Grid', icon: '🏛️' },
        { label: 'Approved Allocations', icon: '✅', badge: approvedBookings.length ? String(approvedBookings.length) : null }
    ];

    return (
        <DashboardLayout role="classroom_admin" navItems={NAV_ITEMS} activeNav={activeNav} onNavClick={setActiveNav}>
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-6 rounded-2xl border border-cyan-100 shadow-xs">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Classroom Operations • {user?.name || 'Class Admin'}</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Classroom Booking Approval Authority • Academic Complex ({user?.branch || 'General'} Block)
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                            Approval Authority Active
                        </span>
                    </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div
                        onClick={() => setActiveNav(0)}
                        className={`p-5 rounded-2xl bg-white border cursor-pointer transition-all shadow-xs ${
                            activeNav === 0 ? 'border-cyan-500 ring-2 ring-cyan-100' : 'border-cyan-100 hover:border-cyan-300'
                        }`}
                    >
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pending Approvals</div>
                        <div className="text-3xl font-black text-amber-600 mt-2">{pendingBookings.length}</div>
                        <div className="text-xs text-amber-700 font-medium mt-1">Awaiting decision</div>
                    </div>
                    <div
                        onClick={() => setActiveNav(1)}
                        className={`p-5 rounded-2xl bg-white border cursor-pointer transition-all shadow-xs ${
                            activeNav === 1 ? 'border-cyan-500 ring-2 ring-cyan-100' : 'border-cyan-100 hover:border-cyan-300'
                        }`}
                    >
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Managed Classrooms</div>
                        <div className="text-3xl font-black text-slate-800 mt-2">{venues.length}</div>
                        <div className="text-xs text-slate-400 font-medium mt-1">Active academic rooms</div>
                    </div>
                    <div
                        onClick={() => setActiveNav(2)}
                        className={`p-5 rounded-2xl bg-white border cursor-pointer transition-all shadow-xs ${
                            activeNav === 2 ? 'border-cyan-500 ring-2 ring-cyan-100' : 'border-cyan-100 hover:border-cyan-300'
                        }`}
                    >
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Approved Allocations</div>
                        <div className="text-3xl font-black text-emerald-600 mt-2">{approvedBookings.length}</div>
                        <div className="text-xs text-emerald-700 font-medium mt-1">Allocated slots</div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white border border-cyan-100 shadow-xs hover:border-cyan-300 transition-all">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Submissions</div>
                        <div className="text-3xl font-black text-blue-900 mt-2">{bookings.length}</div>
                        <div className="text-xs text-slate-400 font-medium mt-1">Classroom requests logged</div>
                    </div>
                </div>

                {/* Tab Switcher Pills */}
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
                                        ? 'bg-cyan-700 text-white shadow-sm'
                                        : 'bg-white text-slate-600 hover:bg-cyan-50 hover:text-cyan-800 border border-slate-200'
                                }`}
                            >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                                {item.badge && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                                        isActive ? 'bg-cyan-800 text-white' : 'bg-cyan-100 text-cyan-800'
                                    }`}>
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Section 1: Pending Approval Queue */}
                {activeNav === 0 && (
                    <div className="p-6 sm:p-7 rounded-2xl bg-white border border-cyan-100 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h2 className="text-lg font-extrabold text-blue-950 flex items-center gap-2">
                                    <span>📥</span> Priority Action Queue • Pending Requests
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">Faculty and Class Representative classroom booking applications</p>
                            </div>
                            <button
                                type="button"
                                onClick={fetchData}
                                className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 bg-cyan-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                            >
                                <span>🔄</span> Refresh Queue
                            </button>
                        </div>

                        {loading ? (
                            <div className="py-12 text-center text-slate-400 text-sm">Loading approval queue...</div>
                        ) : pendingBookings.length === 0 ? (
                            <div className="py-12 text-center text-slate-500 text-sm bg-cyan-50/20 rounded-xl border border-dashed border-cyan-200">
                                🎉 No pending classroom requests awaiting your clearance. Queue is all clear!
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-cyan-50/70 text-slate-600 uppercase font-bold border-b border-cyan-100">
                                        <tr>
                                            <th className="p-3.5">Applicant / Requester</th>
                                            <th className="p-3.5">Classroom Venue</th>
                                            <th className="p-3.5">Purpose / Course</th>
                                            <th className="p-3.5">Date</th>
                                            <th className="p-3.5">Time Slot</th>
                                            <th className="p-3.5 text-right">Administrative Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {pendingBookings.map((b) => {
                                            const vName = b.venue_id?.name || b.venue?.name || 'Classroom';
                                            const vCode = b.venue_id?.venueCode || '';
                                            const vBranch = b.venue_id?.branch || '';
                                            const applicant = b.user?.name || b.user?.username || b.user_id?.name || b.user_id?.username || 'Faculty / CR';
                                            const applicantEmail = b.user?.email || b.user_id?.email || '';
                                            const applicantRole = b.user?.role || b.user_id?.role || 'Staff';
                                            const dateStr = new Date(b.date).toLocaleDateString('en-US', {
                                                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                                            });

                                            const isThisLoading = actionLoading === b._id;

                                            return (
                                                <tr key={b._id} className="hover:bg-cyan-50/30 transition-colors">
                                                    <td className="p-3.5">
                                                        <div className="font-bold text-slate-900">{applicant}</div>
                                                        {applicantEmail && (
                                                            <div className="text-[11px] text-slate-400 font-mono">{applicantEmail}</div>
                                                        )}
                                                        <span className="inline-block mt-1 text-[10px] uppercase font-bold text-cyan-700 bg-cyan-100/60 px-1.5 py-0.5 rounded">
                                                            {applicantRole.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5">
                                                        <div className="font-bold text-slate-900">{vName}</div>
                                                        {vCode && (
                                                            <div className="text-[10px] text-slate-400 font-mono">{vCode} • {vBranch}</div>
                                                        )}
                                                    </td>
                                                    <td className="p-3.5 font-medium max-w-xs">{b.purpose}</td>
                                                    <td className="p-3.5 text-slate-700 font-medium whitespace-nowrap">{dateStr}</td>
                                                    <td className="p-3.5 font-mono text-slate-700 whitespace-nowrap">{b.start_time} - {b.end_time}</td>
                                                    <td className="p-3.5 text-right whitespace-nowrap space-x-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleApprove(b._id)}
                                                            disabled={isThisLoading}
                                                            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all"
                                                        >
                                                            {isThisLoading ? '...' : '✓ Approve'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleReject(b._id)}
                                                            disabled={isThisLoading}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-all"
                                                        >
                                                            ✕ Reject
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

                {/* Section 2: Classroom Master Directory */}
                {activeNav === 1 && (
                    <div className="p-6 sm:p-7 rounded-2xl bg-white border border-cyan-100 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h2 className="text-lg font-extrabold text-blue-950 flex items-center gap-2">
                                    <span>🏛️</span> Classroom Master Inventory
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">Seating capacity, technical amenities, and real-time maintenance states</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {venues.map((v) => (
                                <div key={v._id} className="p-4 rounded-xl border border-cyan-100 bg-cyan-50/20 hover:border-cyan-300 transition-all space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-slate-900 text-sm">{v.name}</h3>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                            {v.status || 'Active'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-600">
                                        Capacity: <span className="font-bold text-slate-800">{v.capacity} seats</span> • Floor {v.floor || 1} • {v.branch}
                                    </div>
                                    <div className="flex flex-wrap gap-1 pt-1">
                                        {v.facilities && v.facilities.length > 0 ? (
                                            v.facilities.map((f, i) => (
                                                <span key={i} className="text-[10px] bg-white border border-cyan-100 px-2 py-0.5 rounded text-cyan-800">
                                                    {f}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[10px] bg-white border border-cyan-100 px-2 py-0.5 rounded text-slate-600">
                                                Smart Projector &amp; Audio
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Section 3: Approved Allocations */}
                {activeNav === 2 && (
                    <div className="p-6 sm:p-7 rounded-2xl bg-white border border-cyan-100 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h2 className="text-lg font-extrabold text-blue-950 flex items-center gap-2">
                                    <span>✅</span> Approved Allocations History
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">Cleared classroom bookings and scheduled lecture reservations</p>
                            </div>
                        </div>

                        {approvedBookings.length === 0 ? (
                            <div className="py-12 text-center text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                No classroom bookings have been approved yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-emerald-50/70 text-slate-600 uppercase font-bold border-b border-emerald-100">
                                        <tr>
                                            <th className="p-3.5">Applicant</th>
                                            <th className="p-3.5">Classroom</th>
                                            <th className="p-3.5">Purpose / Course</th>
                                            <th className="p-3.5">Date</th>
                                            <th className="p-3.5">Time Slot</th>
                                            <th className="p-3.5 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {approvedBookings.map((b) => {
                                            const vName = b.venue_id?.name || b.venue?.name || 'Classroom';
                                            const applicant = b.user?.name || b.user?.username || b.user_id?.name || b.user_id?.username || 'Faculty / CR';
                                            const applicantRole = b.user?.role || b.user_id?.role || 'Staff';
                                            const dateStr = new Date(b.date).toLocaleDateString('en-US', {
                                                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                                            });

                                            return (
                                                <tr key={b._id} className="hover:bg-emerald-50/20 transition-colors">
                                                    <td className="p-3.5">
                                                        <div className="font-bold text-slate-900">{applicant}</div>
                                                        <span className="text-[10px] uppercase font-bold text-slate-500">
                                                            {applicantRole.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5 font-bold text-slate-900">{vName}</td>
                                                    <td className="p-3.5 font-medium">{b.purpose}</td>
                                                    <td className="p-3.5 text-slate-700">{dateStr}</td>
                                                    <td className="p-3.5 font-mono text-slate-700">{b.start_time} - {b.end_time}</td>
                                                    <td className="p-3.5 text-right">
                                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                            Approved ✓
                                                        </span>
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

            </div>
        </DashboardLayout>
    );
};

export default ClassroomAdminDashboardView;
