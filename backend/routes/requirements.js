const express = require('express');
const db = require('../models/database');

const router = express.Router();

// Get all requirements for a job
router.get('/job/:jobId', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM requirements WHERE job_description_id = ? ORDER BY type, title',
      [req.params.jobId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update requirement
router.put('/:id', async (req, res) => {
  try {
    const { title, description, type } = req.body;

    const [result] = await db.execute(
      'UPDATE requirements SET title = ?, description = ?, type = ?, updated = CURRENT_TIMESTAMP WHERE id = ?',
      [title, description, type, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Requirement not found' });
    }

    res.json({ message: 'Requirement updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete requirement
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.execute(
      'DELETE FROM requirements WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Requirement not found' });
    }

    res.json({ message: 'Requirement deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;