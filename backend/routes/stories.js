const express = require('express');
const db = require('../models/database');
const storyMatchingService = require('../services/storyMatchingService');

const router = express.Router();

// Get all stories for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM star_stories WHERE user_id = ? ORDER BY updated DESC',
      [req.params.userId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stories for a specific requirement (via mapping table)
router.get('/requirement/:requirementId', async (req, res) => {
  try {
    const stories = await storyMatchingService.getStoriesForRequirement(req.params.requirementId);
    res.json(stories);
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
    const { user_id, title, description, situation, task, action, result, notes, requirement_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const [result_db] = await db.execute(
      'INSERT INTO star_stories (user_id, title, description, situation, task, action, result, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [user_id, title || '', description || '', situation || '', task || '', action || '', result || '', notes || '']
    );

    const storyId = result_db.insertId;

    // If requirement_id is provided, map the story to the requirement
    if (requirement_id) {
      await storyMatchingService.mapStoryToRequirement(storyId, requirement_id);
    }

    res.json({ id: storyId, message: 'Story created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update story
router.put('/:id', async (req, res) => {
  try {
    const { title, description, situation, task, action, result, notes } = req.body;

    const [result_db] = await db.execute(
      'UPDATE star_stories SET title = ?, description = ?, situation = ?, task = ?, action = ?, result = ?, notes = ?, updated = CURRENT_TIMESTAMP WHERE id = ?',
      [title || '', description || '', situation || '', task || '', action || '', result || '', notes || '', req.params.id]
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