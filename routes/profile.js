// routes/profile.js (Corrected + Photo Upload)

const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');

const authMiddleware = require('../middleware/auth');

// Models
const User = require('../models/User');
const UserOrientation = require('../models/UserOrientation');
const UserProfile = require('../models/UserProfile');

/**
 * Multer configuration for profile photo uploads
 * Files go to the /uploads folder at the project root.
 * Filenames are namespaced per user: profile-<userId>.<ext>
 */
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: function (req, file, cb) {
    cb(null, 'profile-' + req.user.id + path.extname(file.originalname));
  }
});
const upload = multer({ storage }).single('profilePicture');

/**
 * GET /api/profile/all
 * Get all aggregated profile data for the logged-in user
 */
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch in parallel
    const [user, orientation, profile] = await Promise.all([
      User.findById(userId).select('-password'),
      UserOrientation.findOne({ userId }),
      UserProfile.findOne({ userId })
    ]);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const allProfileData = {
      user,
      orientation: orientation || {},
      profile: profile || {}
    };

    res.json(allProfileData);
  } catch (err) {
    console.error('Error fetching all profile data:', err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * PUT /api/profile/all
 * Update orientation + profile documents together
 */
router.put('/all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { orientationData, profileData } = req.body;

    await Promise.all([
      UserOrientation.findOneAndUpdate(
        { userId },
        { $set: orientationData || {} },
        { upsert: true, new: true }
      ),
      UserProfile.findOneAndUpdate(
        { userId },
        { $set: profileData || {} },
        { upsert: true, new: true }
      )
    ]);

    res.json({ msg: 'Profile updated successfully' });
  } catch (err) {
    console.error('Error updating all profile data:', err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * POST /api/profile/photo
 * Upload/update a user's profile picture
 * Field name must be "profilePicture"
 */
router.post('/photo', authMiddleware, (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ msg: err.message || String(err) });
    if (!req.file) return res.status(400).json({ msg: 'No file selected.' });

    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ msg: 'User not found' });

      user.profilePicture = `/uploads/${req.file.filename}`;
      await user.save();

      res.json({ msg: 'Photo updated', filePath: user.profilePicture });
    } catch (e) {
      console.error('Photo upload error:', e.message);
      res.status(500).send('Server Error');
    }
  });
});

module.exports = router;
