const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

dotenv.config();

// Initialize all Mongoose schemas and models
require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting – max 30 login attempts per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { message: 'Too many authentication attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Main Route / Health Check
app.get('/', (req, res) => {
    res.json({
        message: 'CampusFlow - Smart Class & Halls Vacancy Sharing System API is running',
        modules: {
            auth: 'Active (Email/Password, Google OAuth, JWT, HTTP-Only Cookie)',
            databaseSchema: 'Active (All CampusFlow models registered)'
        },
        status: 'online'
    });
});

// Import Routes
const authRoutes = require('./routes/auth');
const venueRoutes = require('./routes/venues');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai');
const notificationRoutes = require('./routes/notifications');

// Apply auth rate limit to login & register
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/campusflow';
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB connected successfully to', MONGO_URI))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Start the server
const server = app.listen(PORT, () => {
    console.log(`🚀 CampusFlow Server running on http://localhost:${PORT}`);
});

module.exports = app;
