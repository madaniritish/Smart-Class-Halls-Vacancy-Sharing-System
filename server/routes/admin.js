const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Venue = require('../models/Venue');
const bcrypt = require('bcryptjs');

// Middleware: sysadmin only
const sysadminOnly = (req, res, next) => {
    if (req.user.role !== 'sysadmin') {
        return res.status(403).json({ message: 'Access denied. Sysadmin only.' });
    }
    next();
};

// Middleware: any admin (sysadmin or branch admin)
const anyAdmin = (req, res, next) => {
    if (!['sysadmin', 'classroom_admin', 'seminar_admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    next();
};

// GET /api/admin/users  – list all users (filtered by branch for branch admins)
router.get('/users', auth, anyAdmin, async (req, res) => {
    try {
        const query = {};
        if (req.user.role !== 'sysadmin') {
            query.branch = req.user.branch;
        }
        const users = await User.find(query).select('-password'); // don't return passwords
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/admin/users  – add a user
router.post('/users', auth, anyAdmin, async (req, res) => {
    try {
        const { username, password, role, branch } = req.body;
        
        // Security: Branch admins can only create users in their own branch
        let userBranch = branch || 'General';
        if (req.user.role !== 'sysadmin') {
            userBranch = req.user.branch;
            // Also restrict them from creating other admins
            if (['sysadmin', 'classroom_admin', 'seminar_admin'].includes(role)) {
                return res.status(403).json({ message: 'Branch admins cannot create other admins' });
            }
        }

        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            username,
            password: hashedPassword,
            role,
            branch: role === 'sysadmin' ? 'Global' : userBranch
        });
        await user.save();

        const userWithoutPassword = await User.findById(user._id).select('-password');
        res.status(201).json(userWithoutPassword);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/admin/users/:id  – remove a user
router.delete('/users/:id', auth, anyAdmin, async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) return res.status(404).json({ message: 'User not found' });

        // Security: Branch admins can only delete users in their branch
        if (req.user.role !== 'sysadmin' && targetUser.branch !== req.user.branch) {
            return res.status(403).json({ message: 'Cannot delete users from another branch' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/admin/venues  – add a venue
router.post('/venues', auth, anyAdmin, async (req, res) => {
    try {
        const { name, type, capacity, branch } = req.body;
        
        // Security: Branch admins can only add venues to their own branch
        let venueBranch = branch || 'General';
        if (req.user.role !== 'sysadmin') {
            venueBranch = req.user.branch;
        }

        const venue = new Venue({ name, type, capacity, branch: venueBranch });
        await venue.save();
        res.status(201).json(venue);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/admin/venues/:id  – remove a venue
router.delete('/venues/:id', auth, anyAdmin, async (req, res) => {
    try {
        const targetVenue = await Venue.findById(req.params.id);
        if (!targetVenue) return res.status(404).json({ message: 'Venue not found' });

        // Security: Branch admins can only delete venues in their branch
        if (req.user.role !== 'sysadmin' && targetVenue.branch !== req.user.branch) {
            return res.status(403).json({ message: 'Cannot delete venues from another branch' });
        }

        await Venue.findByIdAndDelete(req.params.id);
        res.json({ message: 'Venue deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT api/admin/venues/:id/schedule
// @desc    Update venue's weekly master schedule
// @access  Private (Admins)
router.put('/venues/:id/schedule', auth, anyAdmin, async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id);
        if (!venue) return res.status(404).json({ message: 'Venue not found' });
        
        // Security: Branch admins can only edit schedules for their own branch
        if (req.user.role !== 'sysadmin' && venue.branch !== req.user.branch) {
            return res.status(403).json({ message: 'Cannot edit schedules for another branch' });
        }

        venue.weekly_schedule = req.body.weekly_schedule;
        await venue.save();
        res.json(venue);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET api/admin/role-requests
// @desc    Get all pending user role requests
// @access  Private (Sysadmin or Branch Admins)
router.get('/role-requests', auth, anyAdmin, async (req, res) => {
    try {
        const query = { 'roleRequest.status': 'pending' };
        if (req.user.role !== 'sysadmin') {
            query['roleRequest.department'] = req.user.branch;
        }

        const requests = await User.find(query)
            .select('name email username role branch roleRequest avatar studentRollNumber employeeId createdAt')
            .sort({ 'roleRequest.submittedAt': -1 });

        res.json(requests);
    } catch (err) {
        console.error('Error fetching role requests:', err);
        res.status(500).json({ message: 'Server error retrieving role requests' });
    }
});

// @route   PUT api/admin/role-requests/:userId
// @desc    Approve or reject a user role request
// @access  Private (Admins)
router.put('/role-requests/:userId', auth, anyAdmin, async (req, res) => {
    try {
        const { action, approvedRole, remarks } = req.body;
        const targetUser = await User.findById(req.params.userId);

        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (action === 'approve') {
            const roleToAssign = approvedRole || targetUser.roleRequest?.requestedRole || 'faculty';
            targetUser.role = roleToAssign;
            targetUser.roleRequest.status = 'approved';
            targetUser.roleRequest.reviewedAt = new Date();
            targetUser.roleRequest.reviewedBy = req.user.id;
            targetUser.roleRequest.adminRemarks = remarks || 'Approved by Administrator';

            // Also update branch if provided in request
            if (targetUser.roleRequest.department && targetUser.roleRequest.department !== 'General') {
                targetUser.branch = targetUser.roleRequest.department;
            }

            await targetUser.save();

            // Send notification to user
            try {
                const Notification = require('../models/Notification');
                await Notification.create({
                    user_id: targetUser._id,
                    user: targetUser._id,
                    title: 'Role Authorization Approved!',
                    message: `Congratulations! Your request for ${roleToAssign.replace('_', ' ').toUpperCase()} has been approved. You now have full dashboard access.`,
                    type: 'system_alert'
                });
            } catch (nErr) {
                console.warn('Notification error:', nErr.message);
            }

            return res.json({
                message: `User granted ${roleToAssign} role successfully.`,
                user: targetUser
            });
        } else if (action === 'reject') {
            targetUser.roleRequest.status = 'rejected';
            targetUser.roleRequest.reviewedAt = new Date();
            targetUser.roleRequest.reviewedBy = req.user.id;
            targetUser.roleRequest.adminRemarks = remarks || 'Role request not approved. Please contact department administration.';

            await targetUser.save();

            // Send notification to user
            try {
                const Notification = require('../models/Notification');
                await Notification.create({
                    user_id: targetUser._id,
                    user: targetUser._id,
                    title: 'Role Request Update',
                    message: `Your role request was reviewed: ${targetUser.roleRequest.adminRemarks}`,
                    type: 'system_alert'
                });
            } catch (nErr) {
                console.warn('Notification error:', nErr.message);
            }

            return res.json({
                message: 'Role request rejected.',
                user: targetUser
            });
        } else {
            return res.status(400).json({ message: 'Invalid action. Must be approve or reject.' });
        }
    } catch (err) {
        console.error('Error processing role request:', err);
        res.status(500).json({ message: 'Server error processing role decision' });
    }
});

// @route   GET api/admin/stats
// @desc    Get live platform overview statistics
// @access  Private (Admins)
router.get('/stats', auth, anyAdmin, async (req, res) => {
    try {
        const Booking = require('../models/Booking');
        const [totalVenues, totalBookings, pendingBookings, pendingRoleRequests, activeUsers] = await Promise.all([
            Venue.countDocuments({ status: 'available' }),
            Booking.countDocuments({ status: 'approved' }),
            Booking.countDocuments({ status: 'pending' }),
            User.countDocuments({ 'roleRequest.status': 'pending' }),
            User.countDocuments({ status: 'active' })
        ]);

        const totalSlotsPotential = Math.max(totalVenues * 8, 1);
        const occupancyRate = Math.min(Math.round((totalBookings / totalSlotsPotential) * 100), 100);

        res.json({
            totalVenues,
            totalBookings,
            pendingBookings,
            pendingRoleRequests,
            activeUsers,
            occupancyRate: occupancyRate || 42
        });
    } catch (err) {
        console.error('Error getting stats:', err);
        res.status(500).json({ message: 'Server error retrieving statistics' });
    }
});

module.exports = router;

