// routes/auth.js (Final Updated: Two-Step Signup + Full Auth)

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const PreVerifiedUser = require('../models/PreVerifiedUser'); // temp signup storage
const authMiddleware = require('../middleware/auth');
const sendEmail = require('../utils/email');

// ==================================================
// STEP 1: REQUEST SIGNUP VERIFICATION
// ==================================================
router.post('/request-signup', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ msg: 'Please provide an email address.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ msg: 'An account with this email already exists.' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await PreVerifiedUser.updateOne(
      { email },
      {
        $set: {
          emailVerificationToken: hashedToken,
          emailVerificationExpires: expires,
          isPreVerified: false,
        },
      },
      { upsert: true }
    );

    const verificationURL = `${req.protocol}://${req.get('host')}/signup-step2.html?token=${verificationToken}`;
    const message = `
      <h1>Complete Your CUNYServe Signup</h1>
      <p>Please click the link below to continue creating your account.</p>
      <p>This link will expire in 10 minutes.</p>
      <a href="${verificationURL}" target="_blank">Continue Signup</a>
    `;

    await sendEmail({
      email,
      subject: 'CUNYServe - Complete Your Registration',
      html: message,
    });

    res.status(200).json({ msg: 'Verification email sent! Please check your inbox to continue.' });
  } catch (err) {
    console.error('REQUEST SIGNUP ERROR:', err);
    res.status(500).send('Server Error');
  }
});

// ==================================================
// STEP 2: VERIFY TOKEN AND ALLOW SIGNUP
// ==================================================
router.post('/verify-signup-token', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ msg: 'No token provided.' });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const preVerifiedUser = await PreVerifiedUser.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!preVerifiedUser) {
      return res.status(400).json({ msg: 'Token is invalid or has expired. Please start over.' });
    }

    preVerifiedUser.isPreVerified = true;
    await preVerifiedUser.save();

    res.json({ email: preVerifiedUser.email });
  } catch (err) {
    console.error('VERIFY SIGNUP TOKEN ERROR:', err);
    res.status(500).send('Server Error');
  }
});

// ==================================================
// STEP 3: FINAL SIGNUP (AFTER TOKEN VERIFIED)
// ==================================================
router.post('/signup', async (req, res) => {
  const { name, password, campus, email, token } = req.body;
  if (!name || !password || !campus || !email || !token) {
    return res.status(400).json({ msg: 'Missing required fields.' });
  }

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const preVerifiedUser = await PreVerifiedUser.findOne({
      email,
      emailVerificationToken: hashedToken,
      isPreVerified: true,
    });

    if (!preVerifiedUser) {
      return res.status(400).json({ msg: 'Verification failed. Please start the signup process over.' });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'An account with this email already exists.' });
    }

    user = new User({
      name,
      email,
      password, // hashed in pre-save hook
      campus,
      isVerified: true,
    });

    await user.save();
    await PreVerifiedUser.deleteOne({ email });

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, jwtToken) => {
      if (err) throw err;
      const userToReturn = user.toObject();
      delete userToReturn.password;
      res
        .cookie('token', jwtToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        .status(201)
        .json(userToReturn);
    });
  } catch (err) {
    console.error('FINAL SIGNUP ERROR:', err);
    res.status(500).send('Server error');
  }
});

// ==================================================
// LOGIN (Blocks unverified users)
// ==================================================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ msg: 'Please provide email and password' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    if (!user.isVerified) {
      return res.status(401).json({ msg: 'Your account has not been verified. Please check your email.' });
    }

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
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
    });
  } catch (err) {
    console.error('Login Server Error:', err.message);
    res.status(500).send('Server error');
  }
});

// ==================================================
// FORGOT PASSWORD
// ==================================================
router.post('/forgotpassword', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(200).json({ msg: 'If an account with that email exists, a password reset link has been sent.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ msg: 'If an account with that email exists, a password reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    const resetURL = `${req.protocol}://${req.get('host')}/reset-password.html?token=${resetToken}`;
    const message = `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset for your CUNYServe account. Click below:</p>
      <a href="${resetURL}" target="_blank">Reset Your Password</a>
      <p>This link is valid for 10 minutes.</p>
    `;

    await sendEmail({
      email: user.email,
      subject: 'CUNYServe - Password Reset Instructions',
      html: message,
    });

    res.status(200).json({ msg: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (err) {
    console.error('FORGOT PASSWORD ERROR:', err);
    res.status(200).json({ msg: 'If an account with that email exists, a password reset link has been sent.' });
  }
});

// ==================================================
// RESET PASSWORD
// ==================================================
router.post('/resetpassword/:token', async (req, res) => {
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
      return res.status(400).json({ msg: 'Token is invalid or has expired.' });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ msg: 'Password has been reset successfully. You may now log in.' });
  } catch (err) {
    console.error('RESET PASSWORD ERROR:', err);
    res.status(500).json({ msg: 'An error occurred while resetting the password.' });
  }
});

// ==================================================
// CURRENT USER
// ==================================================
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json(req.user);
  } catch (err) {
    console.error('Me Route Error:', err.message);
    res.status(500).send('Server Error');
  }
});

// ==================================================
// LOGOUT
// ==================================================
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
