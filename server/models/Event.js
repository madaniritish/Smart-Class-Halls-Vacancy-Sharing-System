const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Event title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Event description is required'],
        trim: true
    },
    eventType: {
        type: String,
        enum: ['seminar', 'workshop', 'guest_lecture', 'hackathon', 'cultural', 'academic_class', 'meeting', 'other'],
        required: [true, 'Event type is required'],
        index: true
    },
    organizerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Event organizer is required'],
        index: true
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: false
    },
    preferredVenueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue',
        required: false
    },
    expectedParticipants: {
        type: Number,
        default: 50,
        min: [1, 'Expected participants must be at least 1']
    },
    startDate: {
        type: Date,
        required: [true, 'Event start date is required'],
        index: true
    },
    endDate: {
        type: Date,
        required: [true, 'Event end date is required']
    },
    startTime: {
        type: String, // HH:MM
        required: [true, 'Start time is required']
    },
    endTime: {
        type: String, // HH:MM
        required: [true, 'End time is required']
    },
    requiredResources: [{
        type: String,
        trim: true
    }],
    status: {
        type: String,
        enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'cancelled', 'completed'],
        default: 'submitted',
        index: true
    },
    rejectionReason: {
        type: String,
        default: ''
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    approvalDate: {
        type: Date
    }
}, { timestamps: true });

eventSchema.index({ organizerId: 1, status: 1 });
eventSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Event', eventSchema);
