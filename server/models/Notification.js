const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['info', 'success', 'warning', 'error', 'booking_update', 'approval_alert', 'schedule_change', 'system_alert'],
        default: 'info'
    },
    relatedEntity: {
        entityType: {
            type: String,
            enum: ['Booking', 'Event', 'Venue', 'User', 'Schedule', 'System'],
            default: 'System'
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false
        }
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
