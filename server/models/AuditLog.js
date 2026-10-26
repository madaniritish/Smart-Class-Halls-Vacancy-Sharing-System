const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        enum: [
            'approved', 'rejected', // upstream legacy actions
            'booking_created', 'booking_approved', 'booking_rejected', 'booking_cancelled',
            'event_submitted', 'event_approved', 'event_rejected',
            'venue_created', 'venue_updated', 'venue_deleted',
            'user_created', 'user_role_updated', 'user_status_updated'
        ],
        required: true,
        index: true
    },
    entityType: {
        type: String,
        enum: ['Booking', 'Event', 'Venue', 'User', 'Schedule', 'Department'],
        default: 'Booking',
        index: true
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        index: true
    },
    // Backwards-compatible fields with upstream
    booking_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: false
    },
    admin_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        index: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    },
    reason: {
        type: String,
        default: ''
    },
    ipAddress: {
        type: String,
        default: ''
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
