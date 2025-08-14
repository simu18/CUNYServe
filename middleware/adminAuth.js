// middleware/adminAuth.js (Debug Version)

const User = require('../models/User');

// This middleware assumes it runs *after* the standard authMiddleware,
// which means `req.user` should be available.
const adminAuth = async (req, res, next) => {
    console.log('--- Admin Auth Middleware Running ---');

    // DEFINE YOUR ADMIN EMAIL(S) HERE
    const adminEmails = ['iiixflomey@mkzaso.com'];

    if (req.user && req.user.email) {
        console.log(`Checking if user '${req.user.email}' is an admin.`);
        console.log(`Admin list contains: [${adminEmails.join(', ')}]`);

        if (adminEmails.includes(req.user.email)) {
            console.log('✅ Access Granted: User is an admin.');
            next(); // User is an admin, proceed to the actual route handler.
        } else {
            console.log('❌ Access Denied: User is not in the admin list.');
            res.status(403).json({ msg: 'Forbidden: Admin access required.' });
        }
    } else {
        console.log('❌ Access Denied: No user found on the request. This should not happen after authMiddleware.');
        res.status(401).json({ msg: 'Not authorized' });
    }
};

module.exports = adminAuth;