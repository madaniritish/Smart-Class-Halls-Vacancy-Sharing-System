import { useState, useContext } from 'react';
import { AuthContext, getRoleRedirect } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';

const VERIFIED_ROLES = [
    { role: 'Faculty', identifier: 'faculty_john', label: 'Faculty (Dr. John)' },
    { role: 'CR', identifier: 'cr_mary', label: 'Class Rep (Mary)' },
    { role: 'Event Organizer', identifier: 'organizer_alex', label: 'Organizer (Alex)' },
    { role: 'Classroom Admin', identifier: 'admin_classroom', label: 'Class Admin (Ramesh)' },
    { role: 'Seminar Admin', identifier: 'admin_seminar', label: 'Seminar Admin (Sunita)' },
    { role: 'System Admin', identifier: 'admin_sys', label: 'Sysadmin' }
];

/* Inline styles for light blue/white theme */
const S = {
    page: {
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '1.5rem',
        background: 'linear-gradient(135deg, #e8f0fe 0%, #f0f4ff 50%, #e3edff 100%)',
        fontFamily: "'Inter','Segoe UI',sans-serif", position: 'relative', overflow: 'hidden'
    },
    blob1: {
        position: 'absolute', top: '-80px', right: '-80px', width: '350px', height: '350px',
        borderRadius: '50%', background: 'radial-gradient(circle,rgba(37,99,235,.12),transparent)', pointerEvents: 'none'
    },
    blob2: {
        position: 'absolute', bottom: '-60px', left: '-60px', width: '300px', height: '300px',
        borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,.10),transparent)', pointerEvents: 'none'
    },
    wrap: { width: '100%', maxWidth: '460px', position: 'relative', zIndex: 10, margin: '2rem 0' },
    logoBox: {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '72px', height: '72px', borderRadius: '18px', marginBottom: '1rem',
        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
        boxShadow: '0 12px 28px -4px rgba(37,99,235,.35)'
    },
    card: {
        background: '#fff', borderRadius: '20px', padding: '2rem',
        boxShadow: '0 4px 32px rgba(37,99,235,.10),0 1px 4px rgba(0,0,0,.06)',
        border: '1px solid #e2eaf8'
    },
    inputBase: {
        width: '100%', padding: '.75rem 1rem', borderRadius: '10px',
        border: '1.5px solid #d1d5db', fontSize: '.875rem', color: '#111827',
        background: '#f9fafb', outline: 'none', boxSizing: 'border-box'
    },
    label: { display: 'block', fontSize: '.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.5rem' },
    submitBtn: (loading) => ({
        width: '100%', padding: '.8rem 1rem', borderRadius: '12px', border: 'none',
        background: loading ? '#93c5fd' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
        color: '#fff', fontWeight: 700, fontSize: '.9375rem',
        cursor: loading ? 'not-allowed' : 'pointer',
        boxShadow: loading ? 'none' : '0 4px 14px rgba(37,99,235,.35)',
        transition: 'all .2s ease', letterSpacing: '.01em'
    }),
    googleBtn: {
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '10px', padding: '.75rem 1rem', borderRadius: '12px', fontWeight: 600,
        fontSize: '.875rem', cursor: 'pointer', background: '#fff', color: '#374151',
        border: '1.5px solid #d1d5db', marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,.08)', transition: 'all .18s ease'
    },
    divider: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' },
    divLine: { flex: 1, height: '1px', background: '#e5e7eb' },
    divText: { fontSize: '.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' },
    errorBox: {
        display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '12px',
        marginBottom: '1.25rem', padding: '.875rem',
        background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '.8125rem'
    },
    accountBtn: {
        padding: '.5rem', fontSize: '.7rem', borderRadius: '8px',
        background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
        cursor: 'pointer', textAlign: 'left', transition: 'all .15s ease', overflow: 'hidden'
    },
};

const Login = () => {
    const { login, googleLogin } = useContext(AuthContext);
    const navigate = useNavigate();

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const loggedUser = await login(identifier, password);
            const targetPath = getRoleRedirect(loggedUser.role);
            navigate(targetPath);
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    // Real Google OAuth - opens Google account picker popup (no manual email entry)
    const triggerGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setError('');
            setLoading(true);
            try {
                const loggedUser = await googleLogin({ accessToken: tokenResponse.access_token });
                const targetPath = getRoleRedirect(loggedUser.role);
                navigate(targetPath);
            } catch (err) {
                setError(err.response?.data?.message || 'Google sign-in failed. Your Google account may not be registered in the system.');
            } finally {
                setLoading(false);
            }
        },
        onError: (err) => {
            console.error('Google OAuth error:', err);
            setError('Google sign-in was cancelled or failed. Please try again.');
        },
        flow: 'implicit',
    });

    const fillAccount = (id) => {
        setIdentifier(id);
        setPassword('password123');
        setError('');
    };

    return (
        <div style={S.page}>
            <div style={S.blob1} />
            <div style={S.blob2} />

            <div style={S.wrap}>
                {/* Logo & Header */}
                <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                    <div style={S.logoBox}>
                        <svg style={{ width: '38px', height: '38px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#1e3a8a', letterSpacing: '-0.02em', margin: '0 0 0.35rem' }}>
                        CampusFlow
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>
                        Smart Class &amp; Halls Vacancy Sharing System
                    </p>
                </div>

                {/* Main Card */}
                <div style={S.card}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e3a8a', margin: 0 }}>Sign In</h2>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>Secure Authentication</span>
                    </div>

                    {error && (
                        <div style={S.errorBox}>
                            <svg style={{ width: '18px', height: '18px', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Google OAuth Button - opens real Google account picker */}
                    <button
                        type="button"
                        onClick={() => triggerGoogleLogin()}
                        disabled={loading}
                        style={{ ...S.googleBtn, opacity: loading ? 0.6 : 1 }}
                        onMouseOver={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.background = '#f0f4ff'; }}
                        onMouseOut={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#fff'; }}
                    >
                        <svg style={{ width: "20px", height: "20px" }} viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span>Continue with Google</span>
                    </button>

                    {/* Divider */}
                    <div style={S.divider}>
                        <div style={S.divLine} />
                        <span style={S.divText}>or</span>
                        <div style={S.divLine} />
                    </div>

                    {/* Credentials Form */}
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={S.label}>Username or Email</label>
                            <input
                                id="identifier"
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="e.g. faculty_john or admin@campusflow.edu"
                                required
                                style={S.inputBase}
                                onFocus={e => e.target.style.borderColor = '#2563eb'}
                                onBlur={e => e.target.style.borderColor = '#d1d5db'}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <label style={{ ...S.label, margin: 0 }}>Password</label>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ fontSize: '0.75rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                style={S.inputBase}
                                onFocus={e => e.target.style.borderColor = '#2563eb'}
                                onBlur={e => e.target.style.borderColor = '#d1d5db'}
                            />
                        </div>

                        <button
                            id="sign-in-btn"
                            type="submit"
                            disabled={loading}
                            style={S.submitBtn(loading)}
                        >
                            {loading ? 'Signing in...' : 'Sign In →'}
                        </button>
                    </form>

                    {/* Quick Access Roles */}
                    <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textAlign: 'center', margin: '0 0 0.75rem' }}>
                            &#9889; Quick Sign-In — Verified Campus Roles
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
                            {VERIFIED_ROLES.map((acc) => (
                                <button
                                    key={acc.identifier}
                                    type="button"
                                    onClick={() => fillAccount(acc.identifier)}
                                    style={S.accountBtn}
                                    onMouseOver={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#1d4ed8'; e.currentTarget.style.background = '#eff6ff'; }}
                                    onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = '#f1f5f9'; }}
                                    title={`Click to fill ${acc.label}`}
                                >
                                    <span style={{ fontWeight: 700, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.role}</span>
                                    <span style={{ fontSize: '0.625rem', color: '#94a3b8', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.identifier}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.6 }}>
                    <p style={{ margin: 0 }}>&#128274; Passwords secured with bcryptjs &bull; JWT authentication</p>
                    <p style={{ margin: 0 }}>Roles verified from MongoDB</p>
                </div>
            </div>

        </div>
    );
};

export default Login;
