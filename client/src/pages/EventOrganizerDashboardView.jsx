import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';

const NAV_ITEMS = [
    { label: 'Propose Event Slot', icon: '📢' },
    { label: 'Reserved Seminar Halls', icon: '🏛️' },
    { label: 'Auditoriums & Halls Directory', icon: '🎭' }
];

const TIME_SLOTS = [
    { start: '09:00', end: '13:00', label: 'Morning Session (09:00 AM – 01:00 PM)' },
    { start: '14:00', end: '18:00', label: 'Afternoon Session (02:00 PM – 06:00 PM)' },
    { start: '09:00', end: '17:00', label: 'Full Day Event (09:00 AM – 05:00 PM)' },
    { start: '18:00', end: '21:00', label: 'Evening Symposium (06:00 PM – 09:00 PM)' }
];

const EventOrganizerDashboardView = () => {
    const { user } = useContext(AuthContext);
    const [activeNav, setActiveNav] = useState(0);

    const [halls, setHalls] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [loadingHalls, setLoadingHalls] = useState(true);
    const [loadingBookings, setLoadingBookings] = useState(true);

    const [eventName, setEventName] = useState('');
    const [category, setCategory] = useState('Academic Research Seminar');
    const [selectedHall, setSelectedHall] = useState('');
    const [eventDate, setEventDate] = useState(() => {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 3);
        return nextWeek.toISOString().split('T')[0];
    });
    const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
    const [participantsCount, setParticipantsCount] = useState(150);
    const [purpose, setPurpose] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    const fetchHalls = async () => {
        try {
            const res = await api.get('/venues');
            const seminarVenues = res.data.filter(v => v.type === 'seminar_hall' || v.type === 'auditorium');
            setHalls(seminarVenues.length > 0 ? seminarVenues : res.data);
            if (seminarVenues.length > 0) setSelectedHall(seminarVenues[0]._id);
            else if (res.data.length > 0) setSelectedHall(res.data[0]._id);
        } catch (err) {
            console.error('Fetch halls error:', err);
        } finally {
            setLoadingHalls(false);
        }
    };

    const fetchBookings = async () => {
        try {
            const res = await api.get('/bookings');
            setMyBookings(res.data || []);
        } catch (err) {
            console.error('Fetch event bookings error:', err);
        } finally {
            setLoadingBookings(false);
        }
    };

    useEffect(() => {
        fetchHalls();
        fetchBookings();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!eventName.trim() || !selectedHall || !eventDate || !purpose.trim()) {
            return showToast('Please enter event name, venue, date, and description.', 'error');
        }

        const slot = TIME_SLOTS[selectedSlotIndex];
        setSubmitting(true);

        try {
            await api.post('/bookings', {
                venue_id: selectedHall,
                date: eventDate,
                start_time: slot.start,
                end_time: slot.end,
                event_name: eventName.trim(),
                participants_count: Number(participantsCount) || 100,
                purpose: `[${category}] ${purpose.trim()}`,
                bookingType: 'seminar'
            });

            showToast('Event proposal submitted to Seminar Hall Admin for approval!', 'success');
            setEventName('');
            setPurpose('');
            fetchBookings();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to submit event proposal.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Cancel this event hall booking request?')) return;
        try {
            await api.patch(`/bookings/${id}/cancel`);
            showToast('Event proposal cancelled.', 'info');
            fetchBookings();
        } catch (err) {
            showToast(err.response?.data?.message || 'Could not cancel booking.', 'error');
        }
    };

    const pendingCount = myBookings.filter(b => b.status === 'pending').length;
    const approvedCount = myBookings.filter(b => b.status === 'approved').length;

    return (
        <DashboardLayout role="event_organizer" navItems={NAV_ITEMS} activeNav={activeNav} onNavClick={setActiveNav}>
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-6 rounded-2xl border border-indigo-100 shadow-xs">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Event Portal • {user?.name || 'Club Organizer'}</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Campus Events &amp; Seminar Hall Reservation Management
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            Event Coordinator Clearance
                        </span>
                    </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-white border border-indigo-100 shadow-xs hover:border-indigo-300 transition-all">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Submitted Proposals</div>
                        <div className="text-3xl font-black text-indigo-900 mt-2">{myBookings.length}</div>
                        <div className="text-xs text-indigo-600 font-medium mt-1">Total applications</div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white border border-indigo-100 shadow-xs hover:border-indigo-300 transition-all">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pending Review</div>
                        <div className="text-3xl font-black text-amber-600 mt-2">{pendingCount}</div>
                        <div className="text-xs text-slate-400 font-medium mt-1">Awaiting hall clearance</div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white border border-indigo-100 shadow-xs hover:border-indigo-300 transition-all">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Approved Events</div>
                        <div className="text-3xl font-black text-emerald-600 mt-2">{approvedCount}</div>
                        <div className="text-xs text-emerald-700 font-medium mt-1">Confirmed hall slots</div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white border border-indigo-100 shadow-xs hover:border-indigo-300 transition-all">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Auditoriums &amp; Halls</div>
                        <div className="text-3xl font-black text-slate-800 mt-2">{halls.length}</div>
                        <div className="text-xs text-slate-400 font-medium mt-1">Major venues available</div>
                    </div>
                </div>

                {/* Section 1: Submit Event Proposal Form */}
                <div className="p-6 sm:p-7 rounded-2xl bg-white border border-indigo-100 shadow-xs space-y-5">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                            <h2 className="text-lg font-extrabold text-blue-950 flex items-center gap-2">
                                <span>📢</span> Submit Seminar Hall / Auditorium Proposal
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">Formal application for conferences, symposiums, technical fests, and workshops</p>
                        </div>
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Hall Booking
                        </span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Official Event Title *
                                </label>
                                <input
                                    type="text"
                                    value={eventName}
                                    onChange={(e) => setEventName(e.target.value)}
                                    placeholder="e.g. Campus Tech Conclave 2026: AI & Cloud Computing"
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Event Category *
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option>Academic Research Seminar</option>
                                    <option>Industry Expert Guest Lecture</option>
                                    <option>Technical Hackathon / Coding Fest</option>
                                    <option>Student Club Cultural Symposium</option>
                                    <option>Annual Department Conference</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Target Venue *
                                </label>
                                {loadingHalls ? (
                                    <div className="h-10 bg-slate-100 animate-pulse rounded-xl" />
                                ) : (
                                    <select
                                        value={selectedHall}
                                        onChange={(e) => setSelectedHall(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    >
                                        {halls.map((h) => (
                                            <option key={h._id} value={h._id}>
                                                {h.name} (Capacity: {h.capacity})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Proposed Event Date *
                                </label>
                                <input
                                    type="date"
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Expected Attendees *
                                </label>
                                <input
                                    type="number"
                                    value={participantsCount}
                                    onChange={(e) => setParticipantsCount(e.target.value)}
                                    min="10"
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Time Slot Interval *
                                </label>
                                <select
                                    value={selectedSlotIndex}
                                    onChange={(e) => setSelectedSlotIndex(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    {TIME_SLOTS.map((slot, idx) => (
                                        <option key={slot.label} value={idx}>{slot.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Event Synopsis &amp; Chief Guest Details *
                                </label>
                                <input
                                    type="text"
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                    placeholder="Brief outline of agenda, guest speakers, and sound/projection requirements"
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                            >
                                {submitting ? 'Submitting Proposal...' : 'Submit Event Proposal →'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Section 2: Submitted Event Proposals List */}
                <div className="p-6 sm:p-7 rounded-2xl bg-white border border-indigo-100 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h2 className="text-lg font-extrabold text-blue-950 flex items-center gap-2">
                                <span>📋</span> Event Proposal Status &amp; Clearances
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">Real-time approvals from the Seminar Hall Administrator</p>
                        </div>
                        <button
                            type="button"
                            onClick={fetchBookings}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            🔄 Refresh
                        </button>
                    </div>

                    {loadingBookings ? (
                        <div className="py-12 text-center text-slate-400 text-sm">Loading event bookings...</div>
                    ) : myBookings.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-sm bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                            No event hall reservations requested yet. Use the form above to submit an event proposal.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-indigo-50/70 text-slate-600 uppercase font-bold border-b border-indigo-100">
                                    <tr>
                                        <th className="p-3.5">Venue</th>
                                        <th className="p-3.5">Event Name &amp; Purpose</th>
                                        <th className="p-3.5">Audience</th>
                                        <th className="p-3.5">Date</th>
                                        <th className="p-3.5">Timing</th>
                                        <th className="p-3.5">Status</th>
                                        <th className="p-3.5 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {myBookings.map((b) => {
                                        const vName = b.venue_id?.name || b.venue?.name || 'Seminar Hall';
                                        const dateStr = new Date(b.date).toLocaleDateString('en-US', {
                                            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                                        });

                                        return (
                                            <tr key={b._id} className="hover:bg-indigo-50/30 transition-colors">
                                                <td className="p-3.5 font-bold text-slate-900">{vName}</td>
                                                <td className="p-3.5 font-medium">
                                                    <div className="font-bold text-slate-900">{b.event_name || 'Campus Event'}</div>
                                                    <div className="text-slate-500 text-[11px] truncate max-w-xs">{b.purpose}</div>
                                                </td>
                                                <td className="p-3.5 text-slate-600">{b.participants_count || '100+'}</td>
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
                                                            Under Review
                                                        </span>
                                                    )}
                                                    {b.status === 'rejected' && (
                                                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                                                            Rejected
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

export default EventOrganizerDashboardView;
