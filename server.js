// server.js (Restored)

require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./config/db');

connectDB();

const app = express();

// --- Core Middleware ---
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- Static Folders ---
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- API Routes (All Enabled) ---
console.log('--- Attaching API routes ---');

app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/events', require('./routes/events'));
app.use('/api/onboarding', require('./routes/onboarding'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/public', require('./routes/public'));

console.log('--- Finished attaching all API routes ---');

// --- Server Listening ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));