import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';

const NAV_ITEMS = [
    { label: 'Classroom Booking', icon: '🏫' },
    { label: 'My Bookings & Schedule', icon: '📅' },
    { label: 'Live Vacancy Grid', icon: '📊' },
];

const TIME_SLOTS = [
    { start: '09:00', end: '10:00', label: '09:00 AM – 10:00 AM' },
    { start: '10:00', end: '11:00', label: '10:00 AM – 11:00 AM' },
    { start: '11:00', end: '12:00', label: '11:00 AM – 12:00 PM' },
    { start: '12:00', end: '13:00', label: '12:00 PM – 01:00 PM' },
    { start: '14:00', end: '15:00', label: '02:00 PM – 03:00 PM' },
    { start: '15:00', end: '16:00', label: '03:00 PM – 04:00 PM' },
    { start: '16:00', end: '17:00', label: '04:00 PM – 05:00 PM' },
];

const FacultyDashboardView = () => {
    const { user } = useContext(AuthContext);
    const [activeNav, setActiveNav] = useState(0);

    const [venues, setVenues] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [loadingVenues, setLoadingVenues] = useState(true);
    const [loadingBookings, setLoadingBookings] = useState(true);

    // Booking form state
    const [selectedVenue, setSelectedVenue] = useState('');
    const [bookingDate, setBookingDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    });
    const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
    const [purpose, setPurpose] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [conflictInfo, setConflictInfo] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    // Load venues
    const fetchVenues = async () => {
        try {
            const res = await api.get('/venues');
            const classrooms = res.data.filter(v => v.type === 'classroom');
            setVenues(classrooms.length > 0 ? classrooms : res.data);
            if (classrooms.length > 0) {
                setSelectedVenue(classrooms[0]._id);
            } else if (res.data.length > 0) {
                setSelectedVenue(res.data[0]._id);
            }
        } catch (err) {
            console.error('Error fetching venues:', err);
        } finally {
            setLoadingVenues(false);
        }
    };

    // Load user bookings
    const fetchBookings = async () => {
        try {
            const res = await api.get('/bookings');
            setMyBookings(res.data || []);
        } catch (err) {
            console.error('Error fetching bookings:', err);
        } finally {
            setLoadingBookings(false);
        }
    };

    useEffect(() => {
        fetchVenues();
        fetchBookings();
    }, []);

    // Handle Booking submission
    const handleBookingSubmit = async (e, isWaitlist = false) => {
        if (e) e.preventDefault();
        setConflictInfo(null);

        if (!selectedVenue || !bookingDate || !purpose.trim()) {
            return showToast('Please select a classroom, date, and enter the purpose.', 'error');
        }

        const slot = TIME_SLOTS[selectedSlotIndex];
        setSubmitting(true);

        try {
            await api.post('/bookings', {
                venue_id: selectedVenue,
                date: bookingDate,
                start_time: slot.start,
                end_time: slot.end,
                purpose: purpose.trim(),
                isWaitlist
            });

            showToast(isWaitlist ? 'Added to waitlist for this classroom!' : 'Classroom booking request submitted successfully!', 'success');
            setPurpose('');
            setConflictInfo(null);
            fetchBookings();
        } catch (err) {
            if (err.response?.status === 409 && err.response?.data?.canWaitlist) {
                setConflictInfo({
                    message: err.response.data.message || 'Slot is occupied. Would you like to join the waitlist?',
                    canWaitlist: true
                });
            } else {
                showToast(err.response?.data?.message || 'Failed to submit classroom booking.', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Cancel Booking
    const handleCancelBooking = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this booking request?')) return;
        try {
            await api.patch(`/bookings/${id}/cancel`);
            showToast('Booking cancelled.', 'info');
            fetchBookings();
        } catch (err) {
            showToast(err.response?.data?.message || 'Could not cancel booking.', 'error');
        }
    };

    // Computed Metrics
    const pendingCount = myBookings.filter(b => b.status === 'pending').length;
    const approvedCount = myBookings.filter(b => b.status === 'approved').length;

    return (
        <DashboardLayout role="faculty" navItems={NAV_ITEMS} activeNav={activeNav} onNavClick={setActiveNav}>
            <div className="space-y-6">

                {/* Toast Alert */}
                {toast.show && (
                    <div className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between shadow-sm animate-fade-in ${
                        toast.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : toast.type === 'error'
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}>
                        <div className="flex items-center gap-2">
                            <span>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '⚠️' : 'ℹ️'}</span>
                            <span>{toast.message}</span>
                        </div>
                        <button type="button" onClick={() => setToast({ show: false, message: '', type: 'success' })} className="text-slate-400 hover:text-slate-700">✕</button>
                    </div>
                )}

                {/* Welcome Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-6 rounded-2xl border border-blue-100 shadow-xs">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Welcome, {user?.name || 'Professor'}</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Academic Faculty Portal • Department of {user?.branch || 'Computer Science'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Academic Portal Active
                        </span>
                    </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-white border border-blue-100 shadow-xs hover:border-blue-300 transition-all">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Bookings</div>
                        <div className="text-3xl font-black text-blue-900 mt-2">{myBookings.length}</div>
                        <div className="text-xs text-blue-600 font-medium mt-1">Submitted requests</div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white border border-blue-100 shadow-xs hover:border-blue-300 transition-all">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pending Approvals</div>
                        <div className="text-3xl font-black text-amber-600 mt-2">{pendingCount}</div>
                        <div className="text-xs text-slate-400 font-medium mt-1">Under admin review</div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white border border-blue-100 shadow-xs hover:border-blue-300 transition-all">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Approved Allocations</div>
                        <div className="text-3xl font-black text-emerald-600 mt-2">{approvedCount}</div>
                        <div className="text-xs text-emerald-700 font-medium mt-1">Confirmed classroom slots</div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white border border-blue-100 shadow-xs hover:border-blue-300 transition-all">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Managed Classrooms</div>
                        <div className="text-3xl font-black text-slate-800 mt-2">{venues.length}</div>
                        <div className="text-xs text-slate-400 font-medium mt-1">Available across campus</div>
                    </div>
                </div>

                {/* Section 1: Book Classroom Real Interactive Form */}
                <div className="p-6 sm:p-7 rounded-2xl bg-white border border-blue-100 shadow-xs space-y-5">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                            <h2 className="text-lg font-extrabold text-blue-950 flex items-center gap-2">
                                <span>🏫</span> Reserve Classroom Slot
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">Request classroom reservations for regular classes, remedial sessions, or exams</p>
                        </div>
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            Instant Request
                        </span>
                    </div>

                    {/* Conflict / Waitlist Alert */}
                    {conflictInfo && (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm space-y-3">
                            <div className="font-semibold flex items-center gap-2">
                                <span>⚠️</span>
                                <span>{conflictInfo.message}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleBookingSubmit(null, true)}
                                    disabled={submitting}
                                    className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                                >
                                    Join Waitlist
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConflictInfo(null)}
                                    className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-amber-100/50"
                                >
                                    Select Another Slot
                                </button>
                            </div>
                        </div>
                    )}

                    <form onSubmit={(e) => handleBookingSubmit(e, false)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Select Classroom *
                                </label>
                                {loadingVenues ? (
                                    <div className="h-10 bg-slate-100 animate-pulse rounded-xl" />
                                ) : (
                                    <select
                                        value={selectedVenue}
                                        onChange={(e) => setSelectedVenue(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        {venues.map((v) => (
                                            <option key={v._id} value={v._id}>
                                                {v.name} (Cap: {v.capacity}, {v.branch || 'Campus'})
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
                                    value={bookingDate}
                                    onChange={(e) => setBookingDate(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Time Interval *
                                </label>
                                <select
                                    value={selectedSlotIndex}
                                    onChange={(e) => setSelectedSlotIndex(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {TIME_SLOTS.map((slot, idx) => (
                                        <option key={slot.label} value={idx}>{slot.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Purpose / Course Module *
                            </label>
                            <input
                                type="text"
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                placeholder="e.g. CS401 Design & Analysis of Algorithms Remedial Lecture"
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Submitting Request...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Request Classroom Booking</span>
                                        <span>→</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Section 2: Reserved Classroom Slots Table */}
                <div className="p-6 sm:p-7 rounded-2xl bg-white border border-blue-100 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h2 className="text-lg font-extrabold text-blue-950 flex items-center gap-2">
                                <span>📋</span> My Classroom Reservations
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">Live tracking of your submitted booking requests</p>
                        </div>
                        <button
                            type="button"
                            onClick={fetchBookings}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            🔄 Refresh
                        </button>
                    </div>

                    {loadingBookings ? (
                        <div className="py-12 text-center text-slate-400 text-sm">Loading reservations...</div>
                    ) : myBookings.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-sm bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                            No reservations requested yet. Use the form above to reserve your first classroom slot.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-blue-50/70 text-slate-600 uppercase font-bold border-b border-blue-100">
                                    <tr>
                                        <th className="p-3.5">Classroom</th>
                                        <th className="p-3.5">Course / Purpose</th>
                                        <th className="p-3.5">Date</th>
                                        <th className="p-3.5">Slot Time</th>
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
                                            <tr key={b._id} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="p-3.5 font-bold text-slate-900">{vName}</td>
                                                <td className="p-3.5 font-medium">{b.purpose || b.event_name || 'Class Lecture'}</td>
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
                                                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200" title={b.rejection_reason || 'Declined'}>
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
                                                            onClick={() => handleCancelBooking(b._id)}
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

                {/* Section 3: Classroom Overview Grid */}
                <div className="p-6 sm:p-7 rounded-2xl bg-white border border-blue-100 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h2 className="text-lg font-extrabold text-blue-950 flex items-center gap-2">
                                <span>🏛️</span> Department Classroom Directory
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">Specifications and capacity of academic halls</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {venues.map((v) => (
                            <div key={v._id} className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 hover:border-blue-300 transition-all space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-slate-900 text-sm">{v.name}</h3>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                        {v.status || 'Active'}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500">
                                    Capacity: <span className="font-semibold text-slate-700">{v.capacity} students</span> • Floor {v.floor || 1}
                                </div>
                                <div className="flex flex-wrap gap-1 pt-1">
                                    {v.facilities && v.facilities.length > 0 ? (
                                        v.facilities.map((f, i) => (
                                            <span key={i} className="text-[10px] bg-white border border-blue-100 px-2 py-0.5 rounded text-blue-800">
                                                {f}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-[10px] bg-white border border-blue-100 px-2 py-0.5 rounded text-slate-600">Smart Board &amp; Projector</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
};

export default FacultyDashboardView;
