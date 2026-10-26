import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';

const NAV_ITEMS = [
    { label: 'Request Batch Slot', icon: '📝' },
    { label: 'Batch Bookings', icon: '📅' },
    { label: 'Vacant Rooms Directory', icon: '🟢' },
];

const TIME_SLOTS = [
    { start: '16:00', end: '17:00', label: '04:00 PM – 05:00 PM (After Classes)' },
    { start: '17:00', end: '18:00', label: '05:00 PM – 06:00 PM' },
    { start: '09:00', end: '11:00', label: 'Weekend 09:00 AM – 11:00 AM' },
    { start: '11:00', end: '13:00', label: 'Weekend 11:00 AM – 01:00 PM' },
];

const CRDashboardView = () => {
    const { user } = useContext(AuthContext);
    const [activeNav, setActiveNav] = useState(0);

    const [venues, setVenues] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [loadingVenues, setLoadingVenues] = useState(true);
    const [loadingBookings, setLoadingBookings] = useState(true);

    const [selectedVenue, setSelectedVenue] = useState('');
    const [targetDate, setTargetDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    });
    const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
    const [category, setCategory] = useState('Extra Class / Syllabus Catchup');
    const [purpose, setPurpose] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    const fetchVenues = async () => {
        try {
            const res = await api.get('/venues');
            const rooms = res.data.filter(v => v.type === 'classroom');
            setVenues(rooms.length > 0 ? rooms : res.data);
            if (rooms.length > 0) setSelectedVenue(rooms[0]._id);
            else if (res.data.length > 0) setSelectedVenue(res.data[0]._id);
        } catch (err) {
            console.error('CR fetch venues error:', err);
        } finally {
            setLoadingVenues(false);
        }
    };

    const fetchBookings = async () => {
        try {
            const res = await api.get('/bookings');
            setMyBookings(res.data || []);
        } catch (err) {
            console.error('CR fetch bookings error:', err);
        } finally {
            setLoadingBookings(false);
        }
    };

    useEffect(() => {
        fetchVenues();
        fetchBookings();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedVenue || !targetDate || !purpose.trim()) {
            return showToast('Please select classroom, date, and state the batch session purpose.', 'error');
        }

        const slot = TIME_SLOTS[selectedSlotIndex];
        setSubmitting(true);

        try {
            await api.post('/bookings', {
                venue_id: selectedVenue,
                date: targetDate,
                start_time: slot.start,
                end_time: slot.end,
                purpose: `[${category}] ${purpose.trim()}`,
                bookingType: 'extra_class'
            });

            showToast('Classroom booking request submitted to Classroom Admin!', 'success');
            setPurpose('');
            fetchBookings();
        } catch (err) {
            showToast(err.response?.data?.message || 'Booking submission failed.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Cancel this batch classroom request?')) return;
        try {
            await api.patch(`/bookings/${id}/cancel`);
            showToast('Request cancelled.', 'info');
            fetchBookings();
        } catch (err) {
            showToast(err.response?.data?.message || 'Could not cancel request.', 'error');
        }
    };

    const pendingCount = myBookings.filter(b => b.status === 'pending').length;
    const approvedCount = myBookings.filter(b => b.status === 'approved').length;

    return (
        <DashboardLayout role="cr" navItems={NAV_ITEMS} activeNav={activeNav} onNavClick={setActiveNav}>
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-6 rounded-2xl border border-sky-100 shadow-xs">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Hello, {user?.name || 'Class Representative'}</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Class Representative Portal • Department of {user?.branch || 'Computer Science'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                            Batch Mandate Active
                        </span>
                    </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-white border border-sky-100 shadow-xs hover:border-sky-300 transition-all">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Batch Requests</div>
                        <div className="text-3xl font-black text-sky-900 mt-2">{myBookings.length}</div>
                        <div className="text-xs text-sky-600 font-medium mt-1">Total submitted</div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white border border-sky-100 shadow-xs hover:border-sky-300 transition-all">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pending Approval</div>
                        <div className="text-3xl font-black text-amber-600 mt-2">{pendingCount}</div>
                        <div className="text-xs text-slate-400 font-medium mt-1">Under admin review</div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white border border-sky-100 shadow-xs hover:border-sky-300 transition-all">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Confirmed Slots</div>
                        <div className="text-3xl font-black text-emerald-600 mt-2">{approvedCount}</div>
                        <div className="text-xs text-emerald-700 font-medium mt-1">Ready for class</div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white border border-sky-100 shadow-xs hover:border-sky-300 transition-all">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Available Rooms</div>
                        <div className="text-3xl font-black text-slate-800 mt-2">{venues.length}</div>
                        <div className="text-xs text-slate-400 font-medium mt-1">Classrooms in complex</div>
                    </div>
                </div>

                {/* Section 1: CR Room Request Form */}
                <div className="p-6 sm:p-7 rounded-2xl bg-white border border-sky-100 shadow-xs space-y-5">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                            <h2 className="text-lg font-extrabold text-blue-950 flex items-center gap-2">
                                <span>📝</span> Request Classroom for Batch
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">Submit request on behalf of students for extra classes, doubt solving, or project sync</p>
                        </div>
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                            Batch Authorized
                        </span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Session Category *
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                >
                                    <option>Extra Class / Syllabus Catchup</option>
                                    <option>Batch Coding Contest Prep</option>
                                    <option>Remedial Doubt Clearing Session</option>
                                    <option>Class Representative Meeting</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Preferred Classroom *
                                </label>
                                {loadingVenues ? (
                                    <div className="h-10 bg-slate-100 animate-pulse rounded-xl" />
                                ) : (
                                    <select
                                        value={selectedVenue}
                                        onChange={(e) => setSelectedVenue(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        required
                                    >
                                        {venues.map((v) => (
                                            <option key={v._id} value={v._id}>
                                                {v.name} (Cap: {v.capacity})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Target Date *
                                </label>
                                <input
                                    type="date"
                                    value={targetDate}
                                    onChange={(e) => setTargetDate(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Time Slot *
                                </label>
                                <select
                                    value={selectedSlotIndex}
                                    onChange={(e) => setSelectedSlotIndex(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                >
                                    {TIME_SLOTS.map((slot, idx) => (
                                        <option key={slot.label} value={idx}>{slot.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Course Name &amp; Instructor In-Charge *
                                </label>
                                <input
                                    type="text"
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                    placeholder="e.g. CS501 Operating Systems doubt clearing under Prof. Sharma"
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-sky-600 hover:bg-sky-700 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                            >
                                {submitting ? 'Submitting Request...' : 'Submit Batch Request →'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Section 2: Batch Booking Requests Table */}
                <div className="p-6 sm:p-7 rounded-2xl bg-white border border-sky-100 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h2 className="text-lg font-extrabold text-blue-950 flex items-center gap-2">
                                <span>📋</span> Submitted Batch Room Requests
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">Track decisions from the department classroom administrator</p>
                        </div>
                        <button
                            type="button"
                            onClick={fetchBookings}
                            className="text-xs font-semibold text-sky-600 hover:text-sky-800 bg-sky-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            🔄 Refresh
                        </button>
                    </div>

                    {loadingBookings ? (
                        <div className="py-12 text-center text-slate-400 text-sm">Loading batch requests...</div>
                    ) : myBookings.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-sm bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                            No batch requests submitted yet. Use the form above to request an extra class room.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-sky-50/70 text-slate-600 uppercase font-bold border-b border-sky-100">
                                    <tr>
                                        <th className="p-3.5">Venue</th>
                                        <th className="p-3.5">Purpose &amp; Batch</th>
                                        <th className="p-3.5">Date</th>
                                        <th className="p-3.5">Time</th>
                                        <th className="p-3.5">Status</th>
                                        <th className="p-3.5 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {myBookings.map((b) => {
                                        const vName = b.venue_id?.name || b.venue?.name || 'Classroom';
                                        const dateStr = new Date(b.date).toLocaleDateString('en-US', {
                                            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                                        });

                                        return (
                                            <tr key={b._id} className="hover:bg-sky-50/30 transition-colors">
                                                <td className="p-3.5 font-bold text-slate-900">{vName}</td>
                                                <td className="p-3.5 font-medium">{b.purpose}</td>
                                                <td className="p-3.5 text-slate-600">{dateStr}</td>
                                                <td className="p-3.5 font-mono text-slate-700">{b.start_time} - {b.end_time}</td>
                                                <td className="p-3.5">
                                                    {b.status === 'approved' && (
                                                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Approved
                                                        </span>
                                                    )}
                                                    {b.status === 'pending' && (
                                                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                            Pending Approval
                                                        </span>
                                                    )}
                                                    {b.status === 'rejected' && (
                                                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                                                            Rejected
                                                        </span>
                                                    )}
                                                    {b.status === 'waitlisted' && (
                                                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                                            Waitlisted
                                                        </span>
                                                    )}
                                                    {b.status === 'cancelled' && (
                                                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                                                            Cancelled
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3.5 text-right">
                                                    {b.status === 'pending' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCancel(b._id)}
                                                            className="text-red-600 hover:text-red-800 font-semibold text-[11px] hover:underline"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </DashboardLayout>
    );
};

export default CRDashboardView;
