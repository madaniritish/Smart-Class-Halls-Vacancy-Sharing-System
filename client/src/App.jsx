import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider, AuthContext, getRoleRedirect } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AnimatePresence, motion } from 'framer-motion';

// Auth & Role-Based UI Pages
import Login from './pages/Login';
import RoleRequestView from './pages/RoleRequestView';
import FacultyDashboardView from './pages/FacultyDashboardView';
import CRDashboardView from './pages/CRDashboardView';
import EventOrganizerDashboardView from './pages/EventOrganizerDashboardView';
import ClassroomAdminDashboardView from './pages/ClassroomAdminDashboardView';
import SeminarAdminDashboardView from './pages/SeminarAdminDashboardView';
import SysadminDashboardView from './pages/SysadminDashboardView';
import Toast from './components/Toast';

// ProtectedRoute: enforces login and role access
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-white text-slate-800">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 text-sm font-medium tracking-wide">Authenticating CampusFlow Session...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Role-based protection: if user's role is not permitted for this route, redirect to their own role UI
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to={getRoleRedirect(user.role)} replace />;
    }

    return children;
};

// RoleRouter: dynamically routes /dashboard to the authenticated user's specific role interface
const RoleRouter = () => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-white text-slate-800">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 text-sm font-medium">Resolving User Role &amp; Dashboard...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <Navigate to={getRoleRedirect(user.role)} replace />;
};

// PublicLoginRoute: prevents logged-in users from seeing the login screen again
const PublicLoginRoute = () => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return null;
    }

    if (user) {
        return <Navigate to={getRoleRedirect(user.role)} replace />;
    }

    return <Login />;
};

// Smooth Page Animations
const pageVariants = {
    initial: { opacity: 0, y: 10 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, scale: 0.99 }
};

const pageTransition = {
    type: 'tween',
    ease: 'easeInOut',
    duration: 0.25
};

const AnimatedPage = ({ children }) => (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen">
        {children}
    </motion.div>
);

const AnimatedRoutes = () => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                {/* Public / Auth routes */}
                <Route path="/login" element={<AnimatedPage><PublicLoginRoute /></AnimatedPage>} />

                {/* Central Dashboard Redirector */}
                <Route path="/dashboard" element={<RoleRouter />} />
                <Route path="/" element={<RoleRouter />} />

                {/* Role Request / Verification Portal */}
                <Route
                    path="/dashboard/role-request"
                    element={
                        <ProtectedRoute allowedRoles={['student', 'faculty', 'cr', 'event_organizer', 'classroom_admin', 'seminar_admin', 'sysadmin']}>
                            <AnimatedPage><RoleRequestView /></AnimatedPage>
                        </ProtectedRoute>
                    }
                />
                <Route path="/apply-role" element={<Navigate to="/dashboard/role-request" replace />} />

                {/* Role-Specific Protected UI Interfaces */}
                <Route
                    path="/dashboard/faculty"
                    element={
                        <ProtectedRoute allowedRoles={['faculty']}>
                            <AnimatedPage><FacultyDashboardView /></AnimatedPage>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/cr"
                    element={
                        <ProtectedRoute allowedRoles={['cr']}>
                            <AnimatedPage><CRDashboardView /></AnimatedPage>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/event-organizer"
                    element={
                        <ProtectedRoute allowedRoles={['event_organizer']}>
                            <AnimatedPage><EventOrganizerDashboardView /></AnimatedPage>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/classroom-admin"
                    element={
                        <ProtectedRoute allowedRoles={['classroom_admin']}>
                            <AnimatedPage><ClassroomAdminDashboardView /></AnimatedPage>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/seminar-admin"
                    element={
                        <ProtectedRoute allowedRoles={['seminar_admin']}>
                            <AnimatedPage><SeminarAdminDashboardView /></AnimatedPage>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/sysadmin"
                    element={
                        <ProtectedRoute allowedRoles={['sysadmin']}>
                            <AnimatedPage><SysadminDashboardView /></AnimatedPage>
                        </ProtectedRoute>
                    }
                />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </AnimatePresence>
    );
};

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Router>
                    <AnimatedRoutes />
                    <Toast />
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
