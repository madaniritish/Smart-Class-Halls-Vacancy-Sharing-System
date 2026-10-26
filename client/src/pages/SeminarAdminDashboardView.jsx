import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';

const SeminarAdminDashboardView = () => {
    const { user } = useContext(AuthContext);
    const [activeNav, setActiveNav] = useState(0);

    const [bookings, setBookings] = useState([]);
    const [halls, setHalls] = useState([]);
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
            const semHalls = vRes.data.filter(v => v.type === 'seminar_hall' || v.type === 'auditorium');
            setHalls(semHalls.length > 0 ? semHalls : vRes.data);
            setBookings(bRes.data || []);
        } catch (err) {
            console.error('Seminar Admin fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApprove = async (id) => {
        setActionLoading(id);
        try {
            await api.put(`/bookings/${id}/status`, { status: 'approved' });
            showToast('Seminar hall / auditorium booking approved!', 'success');
            fetchData();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to approve event hall booking.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id) => {
        const reason = window.prompt('Please provide the official reason for declining this event hall request:');
        if (reason === null) return;
        if (!reason.trim()) {
            return showToast('A reason is required to reject an event booking.', 'error');
        }

        setActionLoading(id);
        try {
            await api.put(`/bookings/${id}/status`, {
                status: 'rejected',
                rejection_reason: reason.trim()
            });
            showToast('Event booking request rejected.', 'info');
            fetchData();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to reject booking.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const pendingRequests = bookings.filter(b => b.status === 'pending');
    const approvedRequests = bookings.filter(b => b.status === 'approved');

    const NAV_ITEMS = [
        { label: 'Event Hall Queue', icon: '🏛️', badge: pendingRequests.length ? String(pendingRequests.length) : null },
        { label: 'Auditoriums Directory', icon: '🎭' },
        { label: 'Approved Events', icon: '✅', badge: approvedRequests.length ? String(approvedRequests.length) : null }
    ];

    return (
        <DashboardLayout role="seminar_admin" navItems={NAV_ITEMS} activeNav={activeNav} onNavClick={setActiveNav}>
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
                        <h1 className="text-2xl font-black text-slate-900">Auditoriums &amp; Seminar Halls • {user?.name || 'Seminar Admin'}</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Auditorium Complex Management • Institutional Events, Seminars &amp; Major Conferences
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            Hall In-Charge Active
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
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pending Hall Requests</div>
                        <div className="text-3xl font-black text-amber-600 mt-2">{pendingRequests.length}</div>
                        <div className="text-xs text-amber-700 font-medium mt-1">Requiring clearance</div>
                    </div>
                    <div
                        onClick={() => setActiveNav(1)}
                        className={`p-5 rounded-2xl bg-white border cursor-pointer transition-all shadow-xs ${
                            activeNav === 1 ? 'border-blue-500 ring-2 ring-blue-100' : 'border-blue-100 hover:border-blue-300'
                        }`}
                    >
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Managed Major Halls</div>
                        <div className="text-3xl font-black text-slate-800 mt-2">{halls.length}</div>
                        <div className="text-xs text-slate-400 font-medium mt-1">Auditoriums &amp; Seminar Halls</div>
                    </div>
                    <div
                        onClick={() => setActiveNav(2)}
                        className={`p-5 rounded-2xl bg-white border cursor-pointer transition-all shadow-xs ${
                            activeNav === 2 ? 'border-blue-500 ring-2 ring-blue-100' : 'border-blue-100 hover:border-blue-300'
                        }`}
                    >
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Approved Events</div>
                        <div className="text-3xl font-black text-emerald-600 mt-2">{approvedRequests.length}</div>
                        <div className="text-xs text-emerald-700 font-medium mt-1">Allocated slots this term</div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white border border-blue-100 shadow-xs hover:border-blue-300 transition-all">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Proposals</div>
                        <div className="text-3xl font-black text-blue-900 mt-2">{bookings.length}</div>
                        <div className="text-xs text-slate-400 font-medium mt-1">Logged event bookings</div>
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
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-800 border border-slate-200'
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

                {/* Section 1: Seminar Hall Booking Queue */}
                {activeNav === 0 && (
                    <div className="p-6 sm:p-7 rounded-2xl bg-white border border-blue-100 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h2 className="text-lg font-extrabold text-blue-950 flex items-center gap-2">
                                    <span>🏛️</span> Seminar Hall &amp; Auditorium Booking Queue
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">Evaluate event proposals, expected attendees, and audio-visual clearances</p>
                            </div>
                            <button
                                type="button"
                                onClick={fetchData}
                                className="text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                            >
                                <span>🔄</span> Refresh Queue
                            </button>
                        </div>

                        {loading ? (
                            <div className="py-12 text-center text-slate-400 text-sm">Loading event queue...</div>
                        ) : pendingRequests.length === 0 ? (
                            <div className="py-12 text-center text-slate-500 text-sm bg-blue-50/20 rounded-xl border border-dashed border-blue-200">
                                🎉 No pending auditorium requests awaiting your clearance. Everything is up to date!
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-blue-50/70 text-slate-600 uppercase font-bold border-b border-blue-100">
                                        <tr>
                                            <th className="p-3.5">Event Details</th>
                                            <th className="p-3.5">Organizer</th>
                                            <th className="p-3.5">Target Venue</th>
                                            <th className="p-3.5">Date &amp; Time</th>
                                            <th className="p-3.5">Attendees</th>
                                            <th className="p-3.5 text-right">Approval Decision</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {pendingRequests.map((b) => {
                                            const vName = b.venue_id?.name || b.venue?.name || 'Seminar Hall';
                                            const applicantName = b.user?.name || b.user?.username || b.user_id?.name || b.user_id?.username || 'Club Organizer';
                                            const applicantEmail = b.user?.email || b.user_id?.email || '';
                                            const applicantRole = b.user?.role || b.user_id?.role || 'organizer';
                                            const dateStr = new Date(b.date).toLocaleDateString('en-US', {
                                                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                                            });
                                            const isThisLoading = actionLoading === b._id;

                                            return (
                                                <tr key={b._id} className="hover:bg-blue-50/30 transition-colors">
                                                    <td className="p-3.5">
                                                        <div className="font-bold text-slate-900">{b.event_name || b.purpose || 'Campus Event'}</div>
                                                        <div className="text-slate-500 text-[11px] max-w-xs">{b.purpose}</div>
                                                    </td>
                                                    <td className="p-3.5">
                                                        <div className="font-bold text-slate-900">{applicantName}</div>
                                                        {applicantEmail && (
                                                            <div className="text-[10px] text-slate-400 font-mono">{applicantEmail}</div>
                                                        )}
                                                        <span className="inline-block mt-1 text-[10px] uppercase font-bold text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded">
                                                            {applicantRole.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5">
                                                        <div className="font-bold text-blue-900">{vName}</div>
                                                        <div className="text-[10px] text-slate-400">{b.venue_id?.branch || 'General'}</div>
                                                    </td>
                                                    <td className="p-3.5 whitespace-nowrap">
                                                        <div className="text-slate-700 font-medium">{dateStr}</div>
                                                        <div className="font-mono text-slate-500 text-[11px]">{b.start_time} - {b.end_time}</div>
                                                    </td>
                                                    <td className="p-3.5 font-semibold text-slate-800">{b.participants_count || '100+'}</td>
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

                {/* Section 2: Auditoriums & Major Halls Inventory */}
                {activeNav === 1 && (
                    <div className="p-6 sm:p-7 rounded-2xl bg-white border border-blue-100 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h2 className="text-lg font-extrabold text-blue-950 flex items-center gap-2">
                                    <span>🎭</span> Auditoriums &amp; Seminar Halls Directory
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">Specifications, technical audio-visual gear, and stage dimensions</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {halls.map((h) => (
                                <div key={h._id} className="p-4 rounded-xl border border-blue-100 bg-blue-50/20 hover:border-blue-300 transition-all space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-slate-900 text-sm">{h.name}</h3>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                            Capacity: {h.capacity}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-600">
                                        Type: <span className="font-semibold text-slate-800 capitalize">{h.type.replace('_', ' ')}</span> • Floor {h.floor || 1}
                                    </div>
                                    <div className="flex flex-wrap gap-1 pt-1">
                                        {h.facilities && h.facilities.length > 0 ? (
                                            h.facilities.map((f, i) => (
                                                <span key={i} className="text-[10px] bg-white border border-blue-100 px-2 py-0.5 rounded text-blue-800">
                                                    {f}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[10px] bg-white border border-blue-100 px-2 py-0.5 rounded text-slate-600">
                                                Stage &amp; Professional Sound System
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Section 3: Approved Events */}
                {activeNav === 2 && (
                    <div className="p-6 sm:p-7 rounded-2xl bg-white border border-blue-100 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h2 className="text-lg font-extrabold text-blue-950 flex items-center gap-2">
                                    <span>✅</span> Approved Events History
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">Cleared events, conferences, and allocated seminar slots</p>
                            </div>
                        </div>

                        {approvedRequests.length === 0 ? (
                            <div className="py-12 text-center text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                No seminar hall or auditorium bookings have been approved yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-emerald-50/70 text-slate-600 uppercase font-bold border-b border-emerald-100">
                                        <tr>
                                            <th className="p-3.5">Event Name</th>
                                            <th className="p-3.5">Organizer</th>
                                            <th className="p-3.5">Hall</th>
                                            <th className="p-3.5">Date</th>
                                            <th className="p-3.5">Time</th>
                                            <th className="p-3.5">Attendees</th>
                                            <th className="p-3.5 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {approvedRequests.map((b) => {
                                            const vName = b.venue_id?.name || b.venue?.name || 'Seminar Hall';
                                            const applicantName = b.user?.name || b.user?.username || b.user_id?.name || b.user_id?.username || 'Club Organizer';
                                            const dateStr = new Date(b.date).toLocaleDateString('en-US', {
                                                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                                            });

                                            return (
                                                <tr key={b._id} className="hover:bg-emerald-50/20 transition-colors">
                                                    <td className="p-3.5 font-bold text-slate-900">{b.event_name || b.purpose || 'Event'}</td>
                                                    <td className="p-3.5">{applicantName}</td>
                                                    <td className="p-3.5 font-bold text-blue-900">{vName}</td>
                                                    <td className="p-3.5 text-slate-700">{dateStr}</td>
                                                    <td className="p-3.5 font-mono text-slate-700">{b.start_time} - {b.end_time}</td>
                                                    <td className="p-3.5 font-semibold text-slate-800">{b.participants_count || '100+'}</td>
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

export default SeminarAdminDashboardView;
