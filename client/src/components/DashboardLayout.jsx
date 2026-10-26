import { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const ROLE_THEMES = {
    student: {
        title: 'Student Portal',
        accentBg: 'bg-blue-50',
        accentBorder: 'border-blue-200',
        accentText: 'text-blue-700',
        accentBadge: 'bg-blue-100 text-blue-800 border-blue-300',
        navActive: 'bg-blue-600 text-white shadow-sm font-bold',
        pillColor: 'bg-blue-600',
        roleLabel: 'Campus Student'
    },
    faculty: {
        title: 'Faculty Dashboard',
        accentBg: 'bg-blue-50',
        accentBorder: 'border-blue-200',
        accentText: 'text-blue-700',
        accentBadge: 'bg-blue-100 text-blue-800 border-blue-300',
        navActive: 'bg-blue-600 text-white shadow-sm font-bold',
        pillColor: 'bg-blue-600',
        roleLabel: 'Faculty Member'
    },
    cr: {
        title: 'Class Representative Dashboard',
        accentBg: 'bg-sky-50',
        accentBorder: 'border-sky-200',
        accentText: 'text-sky-700',
        accentBadge: 'bg-sky-100 text-sky-800 border-sky-300',
        navActive: 'bg-blue-600 text-white shadow-sm font-bold',
        pillColor: 'bg-sky-600',
        roleLabel: 'Class Representative (CR)'
    },
    event_organizer: {
        title: 'Event Organizer Dashboard',
        accentBg: 'bg-indigo-50',
        accentBorder: 'border-indigo-200',
        accentText: 'text-indigo-700',
        accentBadge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        navActive: 'bg-blue-600 text-white shadow-sm font-bold',
        pillColor: 'bg-indigo-600',
        roleLabel: 'Campus Event Organizer'
    },
    classroom_admin: {
        title: 'Classroom Administrator Dashboard',
        accentBg: 'bg-cyan-50',
        accentBorder: 'border-cyan-200',
        accentText: 'text-cyan-700',
        accentBadge: 'bg-cyan-100 text-cyan-800 border-cyan-300',
        navActive: 'bg-blue-600 text-white shadow-sm font-bold',
        pillColor: 'bg-cyan-600',
        roleLabel: 'Classroom Admin'
    },
    seminar_admin: {
        title: 'Seminar Hall Administrator Dashboard',
        accentBg: 'bg-blue-50',
        accentBorder: 'border-blue-200',
        accentText: 'text-blue-700',
        accentBadge: 'bg-blue-100 text-blue-800 border-blue-300',
        navActive: 'bg-blue-600 text-white shadow-sm font-bold',
        pillColor: 'bg-blue-700',
        roleLabel: 'Seminar Hall Admin'
    },
    sysadmin: {
        title: 'System Administrator Dashboard',
        accentBg: 'bg-slate-100',
        accentBorder: 'border-slate-300',
        accentText: 'text-slate-800',
        accentBadge: 'bg-slate-200 text-slate-800 border-slate-300',
        navActive: 'bg-blue-600 text-white shadow-sm font-bold',
        pillColor: 'bg-slate-800',
        roleLabel: 'System Administrator'
    }
};

const DashboardLayout = ({ role, navItems = [], activeNav = 0, onNavClick, children }) => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Notifications state
    const [notifications, setNotifications] = useState([]);
    const [showNotifs, setShowNotifs] = useState(false);
    const notifRef = useRef(null);

    const theme = ROLE_THEMES[role] || ROLE_THEMES.faculty;

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data || []);
        } catch (err) {
            // ignore
        }
    };

    useEffect(() => {
        fetchNotifications();
        const timer = setInterval(fetchNotifications, 20000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifs(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            fetchNotifications();
        } catch (err) {
            // ignore
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
            {/* Top Navbar */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-sm">
                <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                    
                    {/* Left: Hamburger + Logo */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 focus:outline-none"
                            aria-label="Toggle navigation"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/dashboard')}>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-md bg-blue-600">
                                CF
                            </div>
                            <div>
                                <span className="font-extrabold text-lg text-blue-900 tracking-tight">CampusFlow</span>
                                <span className="hidden sm:inline-block ml-2 text-xs text-slate-500 border-l border-slate-200 pl-2">
                                    Smart Class &amp; Halls
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Middle: Role Badge Banner */}
                    <div className="hidden md:flex items-center gap-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-2 ${theme.accentBadge}`}>
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            <span>{theme.roleLabel}</span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                            {user?.branch && user.branch !== 'General' ? `Branch: ${user.branch}` : 'Campus Core'}
                        </span>
                    </div>

                    {/* Right: User Profile & Logout */}
                    <div className="flex items-center gap-3">
                        {/* Interactive Notifications Popover */}
                        <div className="relative" ref={notifRef}>
                            <button
                                type="button"
                                onClick={() => setShowNotifs(!showNotifs)}
                                className="relative p-2 text-slate-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                                title="Notifications"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 px-1.5 py-0.2 min-w-[16px] text-[10px] font-bold bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xs">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {showNotifs && (
                                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-blue-100 rounded-2xl shadow-xl z-50 p-4 space-y-3 animate-fade-in">
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                        <span className="font-bold text-sm text-slate-900">Notifications ({notifications.length})</span>
                                        {unreadCount > 0 && (
                                            <button
                                                type="button"
                                                onClick={markAllRead}
                                                className="text-[11px] font-semibold text-blue-600 hover:underline"
                                            >
                                                Mark all as read
                                            </button>
                                        )}
                                    </div>

                                    <div className="max-h-72 overflow-y-auto space-y-2 divide-y divide-slate-50">
                                        {notifications.length === 0 ? (
                                            <div className="text-center py-6 text-xs text-slate-400">
                                                No notifications yet
                                            </div>
                                        ) : (
                                            notifications.map((n) => {
                                                const isBookingAction = n.title?.toLowerCase().includes('booking') || n.message?.toLowerCase().includes('booking');
                                                const isRoleAction = n.title?.toLowerCase().includes('role') || n.message?.toLowerCase().includes('role');
                                                const canNavigate = ['sysadmin', 'classroom_admin', 'seminar_admin'].includes(role);

                                                const handleNotifClick = async () => {
                                                    try {
                                                        if (!n.isRead) {
                                                            await api.put(`/notifications/${n._id}/read`);
                                                            fetchNotifications();
                                                        }
                                                    } catch (e) { /* ignore */ }

                                                    if (canNavigate && onNavClick) {
                                                        if (isRoleAction && role === 'sysadmin') {
                                                            onNavClick(1);
                                                        } else if (isBookingAction) {
                                                            onNavClick(0);
                                                        }
                                                    }
                                                    setShowNotifs(false);
                                                };

                                                return (
                                                    <div
                                                        key={n._id}
                                                        onClick={handleNotifClick}
                                                        className={`pt-2 p-2 rounded-xl text-xs space-y-0.5 cursor-pointer transition-colors ${
                                                            !n.isRead ? 'bg-blue-50/50 font-semibold text-slate-900 hover:bg-blue-50' : 'text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-blue-900 font-bold flex items-center gap-1.5">
                                                                {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                                                                <span>{n.title}</span>
                                                            </div>
                                                            <span className="text-[10px] text-slate-400">
                                                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <div className="text-slate-600 text-[11px] leading-relaxed">{n.message}</div>
                                                        {canNavigate && (isBookingAction || isRoleAction) && (
                                                            <div className="text-[10px] text-blue-600 font-bold pt-1 flex items-center gap-1">
                                                                <span>Open in Approval Queue</span>
                                                                <span>→</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User Snippet */}
                        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                            {user?.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-blue-200" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-300 text-blue-700 flex items-center justify-center text-xs font-bold">
                                    {(user?.name || user?.username || 'U')[0].toUpperCase()}
                                </div>
                            )}
                            <div className="hidden sm:block text-left text-xs leading-tight">
                                <div className="font-semibold text-slate-800 truncate max-w-[130px]">{user?.name || user?.username}</div>
                                <div className="text-slate-500 capitalize truncate max-w-[130px]">{user?.role?.replace('_', ' ')}</div>
                            </div>
                        </div>

                        {/* Logout button */}
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-all ml-1 shadow-sm"
                            title="Sign out of CampusFlow"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Body: Sidebar + Main Content */}
            <div className="flex-1 flex">
                
                {/* Sidebar */}
                <aside className={`
                    fixed lg:static inset-y-16 left-0 z-30 w-64 bg-white border-r border-blue-100 flex flex-col justify-between transition-transform duration-200 ease-in-out shadow-sm
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}>
                    <div className="p-4 space-y-6">
                        
                        {/* User Role Card inside sidebar */}
                        <div className={`p-3.5 rounded-xl border ${theme.accentBg} ${theme.accentBorder}`}>
                            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Current Role</div>
                            <div className={`text-sm font-bold mt-0.5 ${theme.accentText}`}>{theme.roleLabel}</div>
                            <div className="text-xs text-slate-500 mt-1 truncate">{user?.email}</div>
                        </div>

                        {/* Nav Items */}
                        <nav className="space-y-1">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Navigation</div>
                            {navItems.map((item, idx) => {
                                const isActive = activeNav === idx;
                                return (
                                    <button
                                        key={item.label}
                                        type="button"
                                        onClick={() => {
                                            if (onNavClick) onNavClick(idx);
                                            setSidebarOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-left transition-all ${
                                            isActive
                                                ? 'bg-blue-600 text-white shadow-sm font-bold'
                                                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
                                        }`}
                                    >
                                        <span className="text-base">{item.icon}</span>
                                        <span className="flex-1 truncate">{item.label}</span>
                                        {item.badge && (
                                            <span className={`px-1.5 py-0.5 text-[10px] rounded font-mono ${isActive ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'}`}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Bottom Sidebar Status */}
                    <div className="p-4 border-t border-blue-100 text-xs text-slate-500 space-y-2 bg-slate-50/50">
                        <div className="flex items-center justify-between">
                            <span>System State</span>
                            <span className="text-blue-600 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" /> Online
                            </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                            Academic Term 2026 • CampusFlow
                        </div>
                    </div>
                </aside>

                {/* Backdrop on mobile */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-20 bg-slate-900/30 backdrop-blur-xs lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Main Content Area */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
