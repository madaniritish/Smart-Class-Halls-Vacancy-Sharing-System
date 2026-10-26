const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Department name is required'],
        unique: true,
        trim: true
    },
    code: {
        type: String,
        required: [true, 'Department code is required'],
        unique: true,
        uppercase: true,
        trim: true,
        index: true
    },
    buildingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Building',
        required: false
    },
    headOfDepartment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    contactEmail: {
        type: String,
        trim: true,
        lowercase: true
    },
    phoneNumber: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
        index: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
