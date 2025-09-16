const express = require('express');
const db = require('../models/database');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { first_name, last_name, email } = req.body;

    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required' });
    }

    // Check if user already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Create new user
    const [result] = await db.execute(
      'INSERT INTO users (first_name, last_name, email) VALUES (?, ?, ?)',
      [first_name, last_name, email]
    );

    const userId = result.insertId;

    // Return user info (excluding sensitive data if we add passwords later)
    const [newUser] = await db.execute(
      'SELECT id, first_name, last_name, email, created FROM users WHERE id = ?',
      [userId]
    );

    res.status(201).json({
      user: newUser[0],
      message: 'User registered successfully'
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get user by email (simple authentication)
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const [users] = await db.execute(
      'SELECT id, first_name, last_name, email, created FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users (for development/admin purposes)
router.get('/', async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, first_name, last_name, email, created FROM users ORDER BY created DESC'
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, first_name, last_name, email, created FROM users WHERE id = ?',
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;