const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Venue name is required'],
        unique: true,
        trim: true,
        index: true
    },
    venueCode: {
        type: String,
        unique: true,
        sparse: true,
        uppercase: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['classroom', 'seminar_hall', 'auditorium', 'lab'],
        required: [true, 'Venue type is required'],
        index: true
    },
    buildingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Building',
        required: false
    },
    floor: {
        type: Number,
        default: 1
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: false
    },
    branch: {
        type: String,
        enum: ['CSE', 'ECE', 'AIDS', 'MECH', 'CIVIL', 'General', 'Global'],
        default: 'General',
        index: true
    },
    capacity: {
        type: Number,
        required: [true, 'Capacity is required'],
        min: [1, 'Capacity must be at least 1']
    },
    facilities: [{
        type: String,
        trim: true
    }],
    imageUrl: {
        type: String,
        default: ''
    },
    admin_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        index: true
    },
    status: {
        type: String,
        enum: ['available', 'maintenance', 'decommissioned'],
        default: 'available',
        index: true
    },
    weekly_schedule: [{
        day: { type: Number, required: true }, // 0 = Sun, 1 = Mon, ..., 6 = Sat
        start_time: { type: String, required: true },
        end_time: { type: String, required: true },
        label: { type: String, required: true },
        courseCode: { type: String, default: '' },
        facultyName: { type: String, default: '' }
    }]
}, { timestamps: true });

venueSchema.index({ type: 1, branch: 1, status: 1 });
venueSchema.index({ capacity: 1 });

module.exports = mongoose.model('Venue', venueSchema);
