// server.js (With Automation for All Scrapers)

require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoose = require('mongoose'); 
const connectDB = require('./config/db');
const cron = require('node-cron'); // <-- For scheduled scraping
const { runAllScrapers } = require('./scrapers'); // <-- Now using the unified scraper runner

// --- Connect to Database ---
connectDB();

const app = express();

// --- Core Middleware ---
app.use(cors());
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

// =======================================================
// === Automated Scraper Scheduler (Runs All Sources) ===
// =======================================================
// Runs every day at 2:00 AM America/New_York time

cron.schedule('0 2 * * *', () => {
    console.log('🕒 [CRON JOB] Starting scheduled daily scrape of ALL sources...');
    
    runAllScrapers(process.env.MONGO_URI)
        .then(() => {
            console.log('✅ [CRON JOB] Scheduled scrape run finished.');
        })
        .catch(error => {
            console.error('❌ [CRON JOB] Scheduled scrape run failed.', error);
        });
}, {
    scheduled: true,
    timezone: "America/New_York"
});

console.log('✅ Cron job for daily scraping (all sources) has been scheduled.');

// =======================================================

// --- Server Listening ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));
