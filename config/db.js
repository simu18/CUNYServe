const mongoose = require('mongoose');
require('dotenv').config(); // Ensure dotenv is configured

const connectDB = async () => {
    try {
        // Mongoose.connect returns a promise, so we await it
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB;