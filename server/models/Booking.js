const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    bookingNumber: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    venue_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue',
        required: [true, 'Venue is required'],
        index: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: false
    },
    date: {
        type: Date,
        required: [true, 'Booking date is required'],
        index: true
    },
    start_time: {
        type: String, // HH:MM format
        required: [true, 'Start time is required']
    },
    end_time: {
        type: String, // HH:MM format
        required: [true, 'End time is required']
    },
    startDateTime: {
        type: Date,
        index: true
    },
    endDateTime: {
        type: Date,
        index: true
    },
    purpose: {
        type: String,
        required: [true, 'Booking purpose is required'],
        trim: true
    },
    bookingType: {
        type: String,
        enum: ['regular_class', 'extra_class', 'event', 'seminar', 'exam', 'meeting'],
        default: 'extra_class'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'waitlisted', 'cancelled', 'completed'],
        default: 'pending',
        index: true
    },
    assignedAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    rejection_reason: {
        type: String,
        default: ''
    },
    cancellationReason: {
        type: String,
        default: ''
    },
    cancelledAt: {
        type: Date
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    approvalTimestamp: {
        type: Date
    },
    event_name: {
        type: String,
        trim: true,
        default: ''
    },
    participants_count: {
        type: Number,
        min: 0,
        default: 0
    }
}, { timestamps: true });

// Pre-save hook to generate unique bookingNumber if absent
bookingSchema.pre('save', function (next) {
    if (!this.bookingNumber) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        this.bookingNumber = `BK-${dateStr}-${rand}`;
    }
    if (!this.user_id && this.user) {
        this.user_id = this.user;
    }
    if (typeof next === 'function') {
        return next();
    }
});

// Compound indexes for vacancy checking and user history
bookingSchema.index({ venue_id: 1, date: 1, start_time: 1, end_time: 1, status: 1 });
bookingSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
