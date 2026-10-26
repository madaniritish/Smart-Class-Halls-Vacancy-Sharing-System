const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    roleName: {
        type: String,
        required: [true, 'Role identifier is required'],
        unique: true,
        enum: ['student', 'faculty', 'cr', 'event_organizer', 'classroom_admin', 'seminar_admin', 'sysadmin'],
        index: true
    },
    displayName: {
        type: String,
        required: [true, 'Role display name is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    permissions: [{
        type: String,
        trim: true
    }],
    isSystemDefault: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
