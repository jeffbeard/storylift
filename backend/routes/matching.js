const express = require('express');
const storyMatchingService = require('../services/storyMatchingService');

const router = express.Router();

// Get story matches for job requirements
router.post('/job/:jobId', async (req, res) => {
  try {
    const { userId } = req.body;
    const jobId = req.params.jobId;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get job requirements
    const db = require('../models/database');
    const [requirements] = await db.execute(
      'SELECT * FROM requirements WHERE job_description_id = ? ORDER BY type, title',
      [jobId]
    );

    if (requirements.length === 0) {
      return res.json({ matches: [] });
    }

    // Find matches for all requirements
    const matches = await storyMatchingService.findMatches(userId, requirements);

    res.json({ matches });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Map a story to a requirement
router.post('/map', async (req, res) => {
  try {
    const { storyId, requirementId } = req.body;

    if (!storyId || !requirementId) {
      return res.status(400).json({ error: 'Story ID and Requirement ID are required' });
    }

    const success = await storyMatchingService.mapStoryToRequirement(storyId, requirementId);

    if (success) {
      res.json({ message: 'Story mapped to requirement successfully' });
    } else {
      res.status(500).json({ error: 'Failed to map story to requirement' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove mapping between story and requirement
router.delete('/map', async (req, res) => {
  try {
    const { storyId, requirementId } = req.body;

    if (!storyId || !requirementId) {
      return res.status(400).json({ error: 'Story ID and Requirement ID are required' });
    }

    const success = await storyMatchingService.unmapStoryFromRequirement(storyId, requirementId);

    if (success) {
      res.json({ message: 'Story unmapped from requirement successfully' });
    } else {
      res.status(500).json({ error: 'Failed to unmap story from requirement' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stories mapped to a specific requirement
router.get('/requirement/:requirementId/stories', async (req, res) => {
  try {
    const stories = await storyMatchingService.getStoriesForRequirement(req.params.requirementId);
    res.json(stories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;