// middleware/auth.js (With Debugging)

const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
  console.log('--- Auth Middleware Running ---');

  const token = req.cookies.token;

  if (!token) {
    console.log('Middleware Error: No token found in cookies.');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    console.log('Middleware: Token found. Verifying...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log('Middleware: Token decoded successfully. User ID:', decoded.user.id);
    req.user = await User.findById(decoded.user.id).select('-password');

    if (!req.user) {
      console.log('Middleware Error: User not found in DB for this token.');
      return res.status(401).json({ msg: 'User not found, authorization denied' });
    }

    console.log('Middleware Success: User authenticated. Proceeding to next step.');
    next();
  } catch (err) {
    console.error('Middleware Error: Token is not valid.', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
