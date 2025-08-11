// server.js (Final, Stable Version)
require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./config/db');

connectDB();
const app = express();

const corsOptions = { origin: 'http://localhost:3000', credentials: true };
app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/onboarding', require('./routes/onboarding'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/events', require('./routes/events'));
app.use('/api/profile', require('./routes/profile')); 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));