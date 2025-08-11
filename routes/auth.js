// routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// --- Signup Route ---
// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', async (req, res) => {
  // Helpful for debugging
  console.log('Signup endpoint hit with body:', req.body);

  const { name, email, password, campus } = req.body;

  // New field names (with backward-compat fallbacks to your previous names)
  const causes_interests =
    req.body.causes_interests ?? req.body.interests ?? [];
  const availability_basic =
    req.body.availability_basic ?? req.body.availability ?? [];
  const motivation =
    req.body.motivation ?? req.body.bio ?? '';

  // Basic validation
  if (!name || !email || !password || !campus) {
    return res.status(400).json({ msg: 'Please enter all required fields' });
  }

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User with this email already exists' });
    }

    // Create a new user instance (password hashed via pre-save hook)
    user = new User({
      name,
      email,
      password,
      campus,
      // New field names per helper
      causes_interests: Array.isArray(causes_interests) ? causes_interests : [],
      availability_basic: Array.isArray(availability_basic) ? availability_basic : [],
      motivation: motivation || ''
    });

    // Save the user
    await user.save();

    // --- Create JWT ---
    const payload = { user: { id: user.id } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;

        res
          .cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // HTTPS in prod only
            sameSite: 'strict',
            path: '/',                                       // ensure consistent clearing
            maxAge: 7 * 24 * 60 * 60 * 1000
          });

        // Return full user (without password)
        const userToReturn = user.toObject();
        delete userToReturn.password;

        return res.status(201).json(userToReturn);
      }
    );
  } catch (err) {
    console.error('Signup Server Error:', err.message);
    res.status(500).send('Server error');
  }
});

// --- Login Route ---
// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ msg: 'Please provide email and password' });
  }

  try {
    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // --- Create and send JWT ---
    const payload = { user: { id: user.id } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;

        const userToReturn = user.toObject();
        delete userToReturn.password;

        return res
          .cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',                                       // ensure consistent clearing
            maxAge: 7 * 24 * 60 * 60 * 1000
          })
          .json(userToReturn); // Return full user object (no password)
      }
    );
  } catch (err) {
    console.error('Login Server Error:', err.message);
    res.status(500).send('Server error');
  }
});

// --- Get Current User Route ---
// @route   GET /api/auth/me
// @desc    Get the logged-in user's data (validates token)
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // req.user is attached by the authMiddleware
    res.json(req.user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- Logout Route ---
// @route   POST /api/auth/logout
// @desc    Logs the user out by clearing the cookie
// @access  Public
router.post('/logout', (req, res) => {
  res
    .clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',                                           // must match set-cookie options
    })
    .json({ msg: 'Logged out successfully' });
});

module.exports = router;
