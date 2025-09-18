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

// Get intelligent story suggestions for a job
router.get('/suggestions/:jobId', async (req, res) => {
  try {
    const { user_id } = req.query;
    const jobId = req.params.jobId;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get job requirements
    const db = require('../models/database');
    const [requirements] = await db.execute(
      'SELECT * FROM requirements WHERE job_description_id = ? ORDER BY type, title',
      [jobId]
    );

    if (requirements.length === 0) {
      return res.json({
        suggestions: [],
        message: 'No requirements found for this job'
      });
    }

    // Find matches for all requirements
    const matches = await storyMatchingService.findMatches(user_id, requirements);

    // Transform matches into suggestions format
    const suggestions = {
      job_id: parseInt(jobId),
      total_requirements: requirements.length,
      requirements_with_suggestions: matches.length,
      suggestions: matches.map(match => ({
        requirement: {
          id: match.requirement_id,
          title: match.requirement_title,
          description: match.requirement_description
        },
        recommended_stories: match.suggested_stories.map(story => ({
          id: story.story_id,
          title: story.title,
          preview: story.situation,
          match_score: story.score,
          already_mapped: story.is_already_mapped
        }))
      }))
    };

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;