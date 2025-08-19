// routes/onboarding.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const UserOrientation = require('../models/UserOrientation');
const UserProfile = require('../models/UserProfile');

// -------------------------------
// ORIENTATION ROUTES (existing)
// -------------------------------

// @route   GET /api/onboarding/orientation
// @desc    Get user's current orientation data
// @access  Private
router.get('/orientation', authMiddleware, async (req, res) => {
  try {
    let orientation = await UserOrientation.findOne({ userId: req.user.id });

    if (!orientation) {
      // If it doesn't exist, create a new draft one for them
      orientation = await new UserOrientation({ userId: req.user.id }).save();
    }

    res.json(orientation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PATCH /api/onboarding/orientation
// @desc    Save partial updates to orientation data (auto-save)
// @access  Private
router.patch('/orientation', authMiddleware, async (req, res) => {
  try {
    // Use upsert so it creates if missing
    const updatedOrientation = await UserOrientation.findOneAndUpdate(
      { userId: req.user.id },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json(updatedOrientation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/onboarding/orientation/complete
// @desc    Validate and finalize the orientation step
// @access  Private
router.post('/orientation/complete', authMiddleware, async (req, res) => {
  try {
    const orientation = await UserOrientation.findOne({ userId: req.user.id });
    if (!orientation) {
      return res.status(404).json({ msg: 'Orientation data not found. Please fill out the form.' });
    }

    // Validation
    const errors = {};
    if (!orientation.orientation_viewed) errors.orientation_viewed = 'You must view the orientation content.';
    if (!orientation.agree_code_of_conduct) errors.agree_code_of_conduct = 'You must agree to the Code of Conduct.';
    if (!orientation.agree_attendance_policy) errors.agree_attendance_policy = 'You must agree to the Attendance Policy.';
    if (!orientation.emergency_name) errors.emergency_name = 'Emergency contact name is required.';
    if (!orientation.emergency_phone) errors.emergency_phone = 'Emergency contact phone is required.';
    if (!orientation.emergency_relationship) errors.emergency_relationship = 'Emergency contact relationship is required.';
    if (orientation.age_confirm_18_plus === false) {
      if (!orientation.guardian_name) errors.guardian_name = 'Guardian name is required for volunteers under 18.';
      if (!orientation.guardian_phone) errors.guardian_phone = 'Guardian phone is required for volunteers under 18.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ msg: 'Please complete all required fields.', errors });
    }

    // Mark orientation complete
    orientation.status = 'complete';
    orientation.completed_at = new Date();
    await orientation.save();

    // Update user onboarding status
    const user = await User.findById(req.user.id);
    user.onboardingStatus = 'orientation_complete';
    await user.save();

    res.json({ msg: 'Orientation complete!', user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// -------------------------------
// PROFILE ROUTES (new additions)
// -------------------------------

// @route   GET /api/onboarding/profile
// @desc    Get user's current profile data for onboarding
// @access  Private
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    let profile = await UserProfile.findOne({ userId: req.user.id });

    if (!profile) {
      // Pre-fill with data from the main User model if available on req.user
      profile = await new UserProfile({
        userId: req.user.id,
        campus: req.user.campus,                           // pre-fill from signup
        causes: req.user.causes_interests || []            // pre-fill from signup (new field name)
      }).save();
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PATCH /api/onboarding/profile
// @desc    Save partial updates to profile data (auto-save)
// @access  Private
router.patch('/profile', authMiddleware, async (req, res) => {
  try {
    const updatedProfile = await UserProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json(updatedProfile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/onboarding/profile/complete
// @desc    Validate and finalize the profile step
// @access  Private
router.post('/profile/complete', authMiddleware, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({ msg: 'Profile data not found.' });
    }

    // Validation
    const errors = {};
    if (!profile.causes || profile.causes.length === 0) {
      errors.causes = 'Please select at least one cause.';
    }
    if (!profile.opportunity_types || profile.opportunity_types.length === 0) {
      errors.opportunity_types = 'Please select at least one opportunity type.';
    }
    // Add more validation rules as needed

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ msg: 'Please complete all required fields.', errors });
    }

    // Mark profile complete
    profile.status = 'complete';
    profile.completed_at = new Date();
    await profile.save();

    // Update user onboarding status to final
    const user = await User.findById(req.user.id);
    user.onboardingStatus = 'profile_complete';
    await user.save();

    res.json({ msg: 'Profile complete! Welcome to CUNYServe!', user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
