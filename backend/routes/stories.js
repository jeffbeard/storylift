const express = require('express');
const db = require('../models/database');

const router = express.Router();

// Get all stories for a requirement
router.get('/requirement/:requirementId', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM star_stories WHERE requirement_id = ?',
      [req.params.requirementId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single story
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM star_stories WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new story
router.post('/', async (req, res) => {
  try {
    const { requirement_id, situation, task, action, result, notes } = req.body;

    const [result_db] = await db.execute(
      'INSERT INTO star_stories (requirement_id, situation, task, action, result, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [requirement_id, situation || '', task || '', action || '', result || '', notes || '']
    );

    res.json({ id: result_db.insertId, message: 'Story created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update story
router.put('/:id', async (req, res) => {
  try {
    const { situation, task, action, result, notes } = req.body;

    const [result_db] = await db.execute(
      'UPDATE star_stories SET situation = ?, task = ?, action = ?, result = ?, notes = ?, updated = CURRENT_TIMESTAMP WHERE id = ?',
      [situation || '', task || '', action || '', result || '', notes || '', req.params.id]
    );

    if (result_db.affectedRows === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }

    res.json({ message: 'Story updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete story
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.execute(
      'DELETE FROM star_stories WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }

    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;