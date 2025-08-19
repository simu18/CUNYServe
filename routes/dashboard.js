
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const UserOrientation = require('../models/UserOrientation');
const Event = require('../models/Event');

router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const [user, profile, orientation, events] = await Promise.all([
            User.findById(userId).select('-password'),
            UserProfile.findOne({ userId: userId }),
            UserOrientation.findOne({ userId: userId }),
            Event.find({ userId: userId }).sort({ start: 1 })
        ]);

        if (!user || !profile || profile.status !== 'complete') {
            return res.status(403).json({ msg: 'User has not completed onboarding.' });
        }
        res.json({ user, profile, orientation, events });

    } catch (err) {
        console.error("Dashboard API Error:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;