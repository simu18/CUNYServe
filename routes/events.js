// routes/events.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Event = require('../models/Event');

// @route   GET /api/events
// @desc    Get all events for the logged-in user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Find events that belong to the user and sort them by start date
        const events = await Event.find({ userId: req.user.id }).sort({ start: 1 });
        res.json(events);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/events
// @desc    Create a new event
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    const { title, start, end, location, description } = req.body;

    // Basic validation
    if (!title || !start || !end) {
        return res.status(400).json({ msg: 'Title, start date, and end date are required.' });
    }

    try {
        const newEvent = new Event({
            userId: req.user.id,
            title,
            start,
            end,
            location,
            description
        });

        const event = await newEvent.save();
        res.status(201).json(event); // 201 status for created resource
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/events/:id
// @desc    Update an event
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
    const { title, start, end, location, description } = req.body;

    try {
        let event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // Security check: Make sure the user owns the event
        if (event.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Update the fields
        event = await Event.findByIdAndUpdate(
            req.params.id,
            { $set: { title, start, end, location, description } },
            { new: true } // This option returns the modified document
        );

        res.json(event);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/events/:id
// @desc    Delete an event
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        let event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // Security check: Make sure the user owns the event
        if (event.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await Event.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Event removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;