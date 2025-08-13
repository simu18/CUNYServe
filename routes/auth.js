// routes/auth.js (Consolidated: signup + verify + login + forgot/reset + me + logout)

const express = require('express');
const router = express.Router();
const crypto = require('crypto'); // for verification/reset tokens
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const sendEmail = require('../utils/email'); // ensure this exists

// --- SIGNUP (with email verification) ---
// @route   POST /api/auth/signup
// @desc    Register a new user and email them a verification link
// @access  Public
router.post('/signup', async (req, res) => {
  console.log('Signup endpoint hit with body:', req.body);

  const { name, email, password, campus } = req.body;

  // Optional fields you previously used
  const causes_interests = req.body.causes_interests ?? req.body.interests ?? [];
  const availability_basic = req.body.availability_basic ?? req.body.availability ?? [];
  const motivation = req.body.motivation ?? req.body.bio ?? '';

  if (!name || !email || !password || !campus) {
    return res.status(400).json({ msg: 'Please enter all required fields' });
  }

  try {
    let existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: 'User with this email already exists' });
    }

    // Create the user (password should be hashed in your User pre-save hook)
    const user = new User({
      name,
      email,
      password,
      campus,
      causes_interests: Array.isArray(causes_interests) ? causes_interests : [],
      availability_basic: Array.isArray(availability_basic) ? availability_basic : [],
      motivation: motivation || '',
      isVerified: false,
    });

    // Generate verification token (store the HASHED token in DB)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    user.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // Send verification email
    const verificationURL = `${req.protocol}://${req.get('host')}/api/auth/verifyemail/${verificationToken}`;
    const message = `
      <h1>Welcome to CUNYServe!</h1>
      <p>Thanks for signing up. Please verify your email address by clicking the link below:</p>
      <p><a href="${verificationURL}" target="_blank">Verify Your Email</a></p>
      <p>This link will expire in 10 minutes.</p>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'CUNYServe - Email Verification',
        html: message,
      });

      // We do NOT log the user in here. They must verify first.
      return res.status(201).json({
        msg: 'Signup successful! Please check your email to verify your account before logging in.',
      });
    } catch (emailErr) {
      console.error('EMAIL ERROR:', emailErr);
      // Optional: clean up token so user can request a resend later
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();
      return res.status(500).json({ msg: 'Error sending verification email. Please contact support.' });
    }
  } catch (err) {
    console.error('Signup Server Error:', err.message);
    res.status(500).send('Server error');
  }
});

// --- VERIFY EMAIL ---
// @route   GET /api/auth/verifyemail/:token
// @desc    Verify email token and activate account
// @access  Public
router.get('/verifyemail/:token', async (req, res) => {
  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashed,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .send('<h1>Error</h1><p>Token is invalid or has expired. Please try signing up again.</p>');
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Redirect to login with a success flag (frontend can show a "Verified!" banner)
    return res.redirect('/login.html?verified=true');
  } catch (err) {
    console.error('Verify Email Error:', err.message);
    res.status(500).send('<h1>Error</h1><p>An error occurred during verification.</p>');
  }
});

// --- LOGIN (blocks unverified users) ---
// @route   POST /api/auth/login
// @desc    Authenticate user and set HTTP-only cookie
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ msg: 'Please provide email and password' });
  }

  try {
    // Find user and check password
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    // Ensure email is verified before allowing login
    if (!user.isVerified) {
      return res.status(401).json({ msg: 'Your account has not been verified. Please check your email.' });
    }

    // Create JWT and set cookie
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
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
          })
          .json(userToReturn);
      }
    );
  } catch (err) {
    console.error('Login Server Error:', err.message);
    res.status(500).send('Server error');
  }
});

// --- FORGOT PASSWORD ---
// @route   POST /api/auth/forgotpassword
// @desc    Send a password reset link (generic success response)
// @access  Public
router.post('/forgotpassword', async (req, res) => {
  console.log('--- FORGOT PASSWORD ENDPOINT HIT ---');
  const { email } = req.body;

  if (!email) {
    // Still generic to avoid enumeration
    return res.status(200).json({ msg: 'If an account with that email exists, a password reset link has been sent.' });
  }

  console.log('Requesting reset for email:', email);

  try {
    const user = await User.findOne({ email });

    // IMPORTANT: Always send success response to prevent email enumeration
    if (!user) {
      console.log('User not found, but sending success response for security.');
      return res.status(200).json({ msg: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // If user is found, proceed
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token before saving to DB
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();
    console.log('Reset token saved to the database for user:', user.email);

    // Construct reset URL (use plain token in URL)
    const resetURL = `${req.protocol}://${req.get('host')}/reset-password.html?token=${resetToken}`;

    const message = `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset for your CUNYServe account. Please click the link below to set a new password:</p>
      <a href="${resetURL}" target="_blank" style="background-color: #00539B; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Reset Your Password</a>
      <p>This link is valid for 10 minutes. If you did not request this, please ignore this email.</p>
    `;

    await sendEmail({
      email: user.email,
      subject: 'CUNYServe - Password Reset Instructions',
      html: message,
    });

    console.log('Password reset email successfully sent to:', user.email);
    return res.status(200).json({ msg: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (err) {
    console.error('--- FORGOT PASSWORD CRITICAL ERROR ---', err);
    // Still return generic message
    return res.status(200).json({ msg: 'If an account with that email exists, a password reset link has been sent.' });
  }
});

// --- RESET PASSWORD ---
// @route   POST /api/auth/resetpassword/:token
// @desc    Set a new password using a valid reset token
// @access  Public
router.post('/resetpassword/:token', async (req, res) => {
  console.log('--- RESET PASSWORD ENDPOINT HIT ---');

  const { password } = req.body;
  if (!password || String(password).length < 6) {
    return res.status(400).json({ msg: 'Please provide a new password (min 6 characters).' });
  }

  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      console.log('Reset token is invalid or expired.');
      return res.status(400).json({ msg: 'Token is invalid or has expired.' });
    }

    // Set the new password (pre-save hook should hash it)
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    console.log('Password successfully reset for user:', user.email);
    return res.status(200).json({ msg: 'Password has been reset successfully. You may now log in.' });
  } catch (err) {
    console.error('--- RESET PASSWORD CRITICAL ERROR ---', err);
    return res.status(500).json({ msg: 'An error occurred while resetting the password.' });
  }
});

// --- CURRENT USER ---
// @route   GET /api/auth/me
// @desc    Return authenticated user (middleware attaches req.user)
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json(req.user);
  } catch (err) {
    console.error('Me Route Error:', err.message);
    res.status(500).send('Server Error');
  }
});

// --- LOGOUT ---
// @route   POST /api/auth/logout
// @desc    Clear auth cookie
// @access  Public
router.post('/logout', (req, res) => {
  res
    .clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    })
    .json({ msg: 'Logged out successfully' });
});

module.exports = router;
