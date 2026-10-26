import { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

export const ROLE_ROUTES = {
    student: '/dashboard/role-request',
    faculty: '/dashboard/faculty',
    cr: '/dashboard/cr',
    event_organizer: '/dashboard/event-organizer',
    classroom_admin: '/dashboard/classroom-admin',
    seminar_admin: '/dashboard/seminar-admin',
    sysadmin: '/dashboard/sysadmin',
};

export const getRoleRedirect = (role) => {
    const r = role?.toLowerCase();
    if (!r || r === 'student') {
        return '/dashboard/role-request';
    }
    return ROLE_ROUTES[r] || '/dashboard/faculty';
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // On mount, verify session using HTTP-only cookie or stored token via /api/auth/me
    useEffect(() => {
        const verifyAuth = async () => {
            try {
                // Hits protected route that retrieves user & fresh role from the database
                const res = await api.get('/auth/me');
                if (res.data?.user) {
                    setUser(res.data.user);
                }
            } catch (err) {
                // If cookie verification fails, attempt stored token
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                if (token) {
                    try {
                        const resWithToken = await api.get('/auth/me', {
                            headers: { 'x-auth-token': token }
                        });
                        if (resWithToken.data?.user) {
                            setUser(resWithToken.data.user);
                        }
                    } catch (tokenErr) {
                        // Clear expired stored credentials
                        clearStorage();
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            } finally {
                setLoading(false);
            }
        };

        verifyAuth();
    }, []);

    const clearStorage = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('role');
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('user');
    };

    // Standard Login (email or username + password)
    const login = async (identifier, password, rememberMe = true) => {
        const res = await api.post('/auth/login', { identifier, password, rememberMe });
        const { token, user: loggedUser } = res.data;

        const storage = rememberMe ? localStorage : sessionStorage;
        if (token) storage.setItem('token', token);
        storage.setItem('role', loggedUser.role);
        storage.setItem('user', JSON.stringify(loggedUser));

        setUser(loggedUser);
        return loggedUser;
    };

    // Google OAuth Login
    const googleLogin = async (googleData) => {
        const res = await api.post('/auth/google', googleData);
        const { token, user: loggedUser, isNewUser } = res.data;

        localStorage.setItem('token', token);
        localStorage.setItem('role', loggedUser.role);
        localStorage.setItem('user', JSON.stringify(loggedUser));

        // Attach flag so callers know if this was an existing or new account
        loggedUser._isExisting = !isNewUser;

        setUser(loggedUser);
        return loggedUser;
    };

    // Logout
    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (err) {
            console.warn('Logout API error:', err);
        } finally {
            clearStorage();
            setUser(null);
        }
    };

    // Refresh authenticated user from server
    const refreshUser = async () => {
        try {
            const res = await api.get('/auth/me');
            if (res.data?.user) {
                setUser(res.data.user);
                localStorage.setItem('role', res.data.user.role);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                return res.data.user;
            }
        } catch (err) {
            console.warn('Refresh user error:', err);
        }
        return null;
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            googleLogin,
            logout,
            refreshUser,
            getRoleRedirect
        }}>
            {children}
        </AuthContext.Provider>
    );
};
