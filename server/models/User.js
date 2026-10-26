const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'User name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    username: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        // Optional for users authenticated exclusively via Google OAuth
        required: function () {
            return this.authProvider === 'local';
        }
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },
    avatar: {
        type: String,
        default: ''
    },
    authProvider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
    },
    role: {
        type: String,
        enum: ['student', 'faculty', 'cr', 'event_organizer', 'classroom_admin', 'seminar_admin', 'sysadmin'],
        default: 'student',
        required: [true, 'User role is required'],
        index: true
    },
    roleRequest: {
        requestedRole: {
            type: String,
            enum: ['faculty', 'cr', 'event_organizer', 'classroom_admin', 'seminar_admin'],
            default: null
        },
        department: { type: String, default: '' },
        academicYear: { type: String, default: '' },
        section: { type: String, default: '' },
        idNumber: { type: String, default: '' },
        reason: { type: String, default: '' },
        status: {
            type: String,
            enum: ['none', 'pending', 'approved', 'rejected'],
            default: 'none',
            index: true
        },
        submittedAt: { type: Date },
        reviewedAt: { type: Date },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        adminRemarks: { type: String, default: '' }
    },
    branch: {
        type: String,
        enum: ['CSE', 'ECE', 'AIDS', 'MECH', 'CIVIL', 'General', 'Global'],
        default: 'General'
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: false
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'pending_verification'],
        default: 'active',
        index: true
    },
    phoneNumber: {
        type: String,
        trim: true,
        default: ''
    },
    designation: {
        type: String,
        trim: true,
        default: ''
    },
    studentRollNumber: {
        type: String,
        trim: true,
        sparse: true
    },
    employeeId: {
        type: String,
        trim: true,
        sparse: true
    },
    lastLogin: {
        type: Date
    }
}, { timestamps: true });

userSchema.index({ role: 1, status: 1 });

module.exports = mongoose.model('User', userSchema);
