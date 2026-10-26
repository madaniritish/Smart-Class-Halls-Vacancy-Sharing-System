const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    venueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue',
        required: [true, 'Venue reference is required'],
        index: true
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: false
    },
    dayOfWeek: {
        type: Number,
        required: [true, 'Day of week is required (0=Sun, 1=Mon, ..., 6=Sat)'],
        min: 0,
        max: 6,
        index: true
    },
    startTime: {
        type: String, // HH:MM
        required: [true, 'Start time is required']
    },
    endTime: {
        type: String, // HH:MM
        required: [true, 'End time is required']
    },
    semester: {
        type: Number,
        required: [true, 'Semester is required'],
        min: 1,
        max: 8
    },
    section: {
        type: String,
        default: 'A',
        trim: true
    },
    subjectName: {
        type: String,
        required: [true, 'Subject name is required'],
        trim: true
    },
    subjectCode: {
        type: String,
        trim: true,
        uppercase: true,
        default: ''
    },
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        index: true
    },
    academicYear: {
        type: String,
        default: '2025-2026',
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, { timestamps: true });

scheduleSchema.index({ venueId: 1, dayOfWeek: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
