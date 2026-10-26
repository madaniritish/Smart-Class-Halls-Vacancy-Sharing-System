const mongoose = require('mongoose');

const buildingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Building name is required'],
        unique: true,
        trim: true
    },
    code: {
        type: String,
        required: [true, 'Building code is required'],
        unique: true,
        uppercase: true,
        trim: true,
        index: true
    },
    totalFloors: {
        type: Number,
        default: 1,
        min: 1
    },
    description: {
        type: String,
        trim: true
    },
    locationCoordinates: {
        latitude: { type: Number },
        longitude: { type: Number }
    },
    status: {
        type: String,
        enum: ['active', 'maintenance', 'inactive'],
        default: 'active',
        index: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Building', buildingSchema);
