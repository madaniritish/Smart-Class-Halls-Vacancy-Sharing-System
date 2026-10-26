const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const https = require('https');

const JWT_SECRET = process.env.JWT_SECRET || 'campusflow_super_secret_jwt_key_2026';

// Helper to generate JWT token and cookie options
const generateTokenAndSetCookie = (res, user, rememberMe = true) => {
    const payload = {
        user: {
            id: user._id,
            role: user.role
        }
    };

    const expiresIn = rememberMe ? '30d' : '1d';
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn });

    const maxAge = (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000;

    // Set secure HTTP-only cookie
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge
    });

    return token;
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { name, email, username, password, role, branch, designation, studentRollNumber, employeeId } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ message: 'Name, email, password, and role are required.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedUsername = (username || normalizedEmail.split('@')[0]).trim().toLowerCase();

        // Check if user with this email or username already exists
        const existingUser = await User.findOne({
            $or: [
                { email: normalizedEmail },
                { username: normalizedUsername }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                message: existingUser.email === normalizedEmail
                    ? 'An account with this email already exists.'
                    : 'This username is already taken.'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = new User({
            name: name || normalizedUsername,
            email: normalizedEmail,
            username: normalizedUsername,
            password: hashedPassword,
            role,
            branch: branch || 'General',
            authProvider: 'local',
            designation: designation || '',
            studentRollNumber: studentRollNumber || undefined,
            employeeId: employeeId || undefined,
            status: 'active',
            lastLogin: new Date()
        });

        await user.save();

        const token = generateTokenAndSetCookie(res, user, true);

        return res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
                branch: user.branch,
                avatar: user.avatar,
                status: user.status
            }
        });
    } catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ message: 'Server error during registration', error: err.message });
    }
};

// @desc    Authenticate user & get token (Login via email OR username + password)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { identifier, username, email, password, rememberMe = true } = req.body;
        const loginInput = (identifier || username || email || '').trim().toLowerCase();

        if (!loginInput || !password) {
            return res.status(400).json({ message: 'Please provide both username/email and password.' });
        }

        // Find user by either email or username
        const user = await User.findOne({
            $or: [
                { email: loginInput },
                { username: loginInput }
            ]
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials. User not found.' });
        }

        // Check if account is active
        if (user.status !== 'active') {
            return res.status(403).json({
                message: `Account is currently ${user.status}. Please contact the system administrator.`
            });
        }

        // Check if user registered via Google only without a password
        if (user.authProvider === 'google' && !user.password) {
            return res.status(400).json({
                message: 'This account is linked with Google Sign-In. Please click "Sign in with Google".'
            });
        }

        // Compare password with hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials. Incorrect password.' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Issue JWT & HTTP-only cookie
        const token = generateTokenAndSetCookie(res, user, rememberMe);

        return res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
                branch: user.branch,
                avatar: user.avatar,
                status: user.status,
                roleRequest: user.roleRequest || { status: 'none' }
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Server error during login', error: err.message });
    }
};

// @desc    Google OAuth Login / Sign Up
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res) => {
    try {
        const { credential, accessToken, email, name, googleId, avatar, role = 'faculty', branch = 'General' } = req.body;

        let googleUserEmail = email;
        let googleUserName = name;
        let googleUserSub = googleId;
        let googleUserPicture = avatar;

        // If an access token was sent (implicit flow from @react-oauth/google),
        // fetch the user profile from Google's userinfo endpoint
        if (accessToken) {
            try {
                const googleInfo = await new Promise((resolve, reject) => {
                    https.get(
                        `https://www.googleapis.com/oauth2/v3/userinfo`,
                        { headers: { Authorization: `Bearer ${accessToken}` } },
                        (res) => {
                            let data = '';
                            res.on('data', chunk => data += chunk);
                            res.on('end', () => {
                                try { resolve(JSON.parse(data)); }
                                catch (e) { reject(e); }
                            });
                        }
                    ).on('error', reject);
                });
                googleUserEmail = googleInfo.email || googleUserEmail;
                googleUserName = googleInfo.name || googleUserName;
                googleUserSub = googleInfo.sub || googleUserSub;
                googleUserPicture = googleInfo.picture || googleUserPicture;
            } catch (fetchErr) {
                console.warn('Could not fetch Google userinfo:', fetchErr.message);
            }
        }

        // If Google ID token credential was sent from Google One Tap / GIS, decode payload
        if (credential) {
            try {
                const parts = credential.split('.');
                if (parts.length === 3) {
                    const decodedPayload = Buffer.from(parts[1], 'base64').toString('utf-8');
                    const parsed = JSON.parse(decodedPayload);
                    googleUserEmail = parsed.email || googleUserEmail;
                    googleUserName = parsed.name || googleUserName;
                    googleUserSub = parsed.sub || googleUserSub;
                    googleUserPicture = parsed.picture || googleUserPicture;
                }
            } catch (decodeErr) {
                console.warn('Could not decode credential token, falling back to direct fields:', decodeErr.message);
            }
        }

        if (!googleUserEmail) {
            return res.status(400).json({ message: 'Valid Google email is required for Google Sign-In.' });
        }

        const normalizedEmail = googleUserEmail.trim().toLowerCase();

        // 1. Look for existing user with either this googleId or this email
        let user = await User.findOne({
            $or: [
                ...(googleUserSub ? [{ googleId: googleUserSub }] : []),
                { email: normalizedEmail }
            ]
        });

        let isNewUser = false;

        if (user) {
            // Existing user: Link Google ID and avatar if not present
            // NOTE: We do NOT change the existing user's role — it stays as set in the DB
            if (googleUserSub && !user.googleId) {
                user.googleId = googleUserSub;
            }
            if (googleUserPicture && !user.avatar) {
                user.avatar = googleUserPicture;
            }
            user.lastLogin = new Date();
            await user.save();
        } else {
            isNewUser = true;
            // 2. New user: Auto-register using the SAME User model
            const generatedUsername = normalizedEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
            
            // Check if username conflict exists
            let finalUsername = generatedUsername;
            const duplicateUsername = await User.findOne({ username: finalUsername });
            if (duplicateUsername) {
                finalUsername = `${generatedUsername}_${Math.floor(100 + Math.random() * 900)}`;
            }

            user = new User({
                name: googleUserName || normalizedEmail.split('@')[0],
                email: normalizedEmail,
                username: finalUsername,
                googleId: googleUserSub,
                avatar: googleUserPicture || '',
                authProvider: 'google',
                role: 'student', // Default role for newly registered Google accounts
                branch: branch || 'General',
                status: 'active',
                roleRequest: { status: 'none' },
                lastLogin: new Date()
            });

            await user.save();
        }

        // Check user status
        if (user.status !== 'active') {
            return res.status(403).json({
                message: `Account is currently ${user.status}. Please contact the system administrator.`
            });
        }

        // Generate JWT and set HTTP-only cookie
        const token = generateTokenAndSetCookie(res, user, true);

        return res.json({
            message: isNewUser ? 'New Google account created and signed in.' : 'Google authentication successful',
            isNewUser,
            token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
                branch: user.branch,
                avatar: user.avatar,
                status: user.status,
                roleRequest: user.roleRequest || { status: 'none' }
            }
        });
    } catch (err) {
        console.error('Google OAuth error:', err);
        return res.status(500).json({ message: 'Server error during Google authentication', error: err.message });
    }
};

// @desc    Get currently authenticated user & role directly from database
// @route   GET /api/auth/me
// @access  Private (Protected by JWT)
exports.getMe = async (req, res) => {
    try {
        // Retrieve fresh user data including role directly from the database
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'Authenticated user not found in database.' });
        }

        if (user.status !== 'active') {
            return res.status(403).json({ message: `Account is ${user.status}.` });
        }

        return res.json({
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
                branch: user.branch,
                avatar: user.avatar,
                status: user.status,
                phoneNumber: user.phoneNumber,
                designation: user.designation,
                studentRollNumber: user.studentRollNumber,
                employeeId: user.employeeId,
                roleRequest: user.roleRequest || { status: 'none' },
                createdAt: user.createdAt
            }
        });
    } catch (err) {
        console.error('Get authenticated user error:', err);
        return res.status(500).json({ message: 'Server error retrieving user data', error: err.message });
    }
};

// @desc    Log out user & clear HTTP-only cookie
// @route   POST /api/auth/logout
// @access  Public / Private
exports.logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        return res.json({ message: 'Successfully logged out.' });
    } catch (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Server error during logout' });
    }
};
