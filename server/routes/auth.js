const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register user (local email/password)
// @access  Public
router.post('/register', authController.register);

// @route   POST /api/auth/login
// @desc    Authenticate user via Email/Username + password & get JWT/cookie
// @access  Public
router.post('/login', authController.login);

// @route   POST /api/auth/google
// @desc    Authenticate user via Google OAuth (find/create user)
// @access  Public
router.post('/google', authController.googleLogin);

// @route   GET /api/auth/me
// @desc    Get authenticated user's profile and database role
// @access  Private (Protected by JWT)
router.get('/me', authMiddleware, authController.getMe);

// @route   POST /api/auth/logout
// @desc    Log out user and clear HTTP-only authentication cookie
// @access  Public
router.post('/logout', authController.logout);

module.exports = router;
