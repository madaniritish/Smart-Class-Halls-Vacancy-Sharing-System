const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// PUT /api/users/change-password
router.put('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Both fields are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        const user = await User.findById(req.user.id);
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'Password changed successfully!' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/users/request-role – submit role authorization request
router.post('/request-role', auth, async (req, res) => {
    try {
        const { requestedRole, department, academicYear, section, idNumber, reason } = req.body;

        const allowedRoles = ['faculty', 'cr', 'event_organizer', 'classroom_admin', 'seminar_admin'];
        if (!requestedRole || !allowedRoles.includes(requestedRole)) {
            return res.status(400).json({ message: 'Valid campus role is required.' });
        }

        if (!department || !idNumber) {
            return res.status(400).json({ message: 'Department and Roll No / Employee ID are required.' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        user.roleRequest = {
            requestedRole,
            department,
            academicYear: academicYear || '',
            section: section || '',
            idNumber,
            reason: reason || '',
            status: 'pending',
            submittedAt: new Date(),
            adminRemarks: ''
        };

        const validBranches = ['CSE', 'ECE', 'AIDS', 'MECH', 'CIVIL', 'General'];
        if (validBranches.includes(department)) {
            user.branch = department;
        }

        if (requestedRole === 'faculty') {
            user.employeeId = idNumber;
            user.designation = 'Faculty';
        } else {
            user.studentRollNumber = idNumber;
            user.designation = requestedRole === 'cr' ? 'Class Representative' : 'Student Organizer';
        }

        await user.save();

        // Notify Sysadmin
        try {
            const Notification = require('../models/Notification');
            const admins = await User.find({ role: 'sysadmin' }).select('_id');
            for (const admin of admins) {
                await Notification.create({
                    user_id: admin._id,
                    user: admin._id,
                    title: 'New Role Verification Request',
                    message: `${user.name} (${user.email}) requested the ${requestedRole.toUpperCase()} role for ${department}.`,
                    type: 'system_alert'
                });
            }
        } catch (notifErr) {
            console.warn('Notification creation error:', notifErr.message);
        }

        res.json({
            message: 'Role authorization request submitted successfully. Awaiting administrator review.',
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
                branch: user.branch,
                avatar: user.avatar,
                status: user.status,
                roleRequest: user.roleRequest
            }
        });
    } catch (err) {
        console.error('Role request error:', err);
        res.status(500).json({ message: 'Server error processing role request', error: err.message });
    }
});

// GET /api/users/me  – get current user stats and profile
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;


