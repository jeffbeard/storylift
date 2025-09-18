const db = require('../models/database');
const SemanticMatcher = require('./semanticMatcher');

class StoryMatchingService {
  constructor() {
    this.semanticMatcher = new SemanticMatcher();
    this.initialized = false;
  }

  async initialize() {
    if (!this.initialized) {
      await this.semanticMatcher.initialize();
      this.initialized = true;
    }
  }

  // Find potential story matches for a list of requirements
  async findMatches(userId, requirements) {
    await this.initialize();

    try {
      // Get all user's existing stories
      const [userStories] = await db.execute(`
        SELECT s.*,
               GROUP_CONCAT(srm.requirement_id) as mapped_requirement_ids
        FROM star_stories s
        LEFT JOIN story_requirement_mappings srm ON s.id = srm.story_id
        WHERE s.user_id = ?
        GROUP BY s.id
        ORDER BY s.updated DESC
      `, [userId]);

      const matches = [];

      for (const requirement of requirements) {
        const potentialMatches = await this.scoreStories(requirement, userStories);

        if (potentialMatches.length > 0) {
          matches.push({
            requirement_id: requirement.id,
            requirement_title: requirement.title,
            requirement_description: requirement.description,
            suggested_stories: potentialMatches
          });
        }
      }

      return matches;
    } catch (error) {
      console.error('Error finding story matches:', error);
      return [];
    }
  }

  // Score stories based on semantic similarity to requirement
  async scoreStories(requirement, userStories) {
    const matches = [];

    for (const story of userStories) {
      const score = await this.calculateSimilarityScore(requirement, story);

      // Use semantic similarity threshold (0.3 is a good balance)
      if (score > 0.3) {
        // Check if story is already mapped to this requirement
        const mappedRequirements = story.mapped_requirement_ids ?
          story.mapped_requirement_ids.split(',').map(id => parseInt(id)) : [];

        const isAlreadyMapped = mappedRequirements.includes(requirement.id);

        matches.push({
          story_id: story.id,
          title: story.title,
          situation: story.situation?.substring(0, 100) + '...',
          score: Math.round(score * 100),
          is_already_mapped: isAlreadyMapped
        });
      }
    }

    // Sort by score (highest first) and return top 3
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  // Enhanced semantic similarity scoring with domain filtering
  async calculateSimilarityScore(requirement, story) {
    // Apply domain filtering first for obviously unrelated content
    if (this.isDomainMismatch(requirement, story)) {
      return 0;
    }

    // Use semantic similarity from the model
    const semanticScore = await this.semanticMatcher.calculateSimilarity(requirement, story);
    return semanticScore;
  }

  // Check for domain mismatches (like healthcare requirements vs non-healthcare stories)
  isDomainMismatch(requirement, story) {
    const reqText = `${requirement.title} ${requirement.description || ''}`.toLowerCase();
    const storyText = `${story.title} ${story.description || ''} ${story.situation || ''} ${story.task || ''} ${story.action || ''} ${story.result || ''}`.toLowerCase();

    // Healthcare domain filtering - only filter if completely unrelated
    const healthcareKeywords = ['healthcare', 'medical', 'hospital', 'clinical', 'patient', 'pharma', 'medicare', 'medicaid', 'hipaa'];
    const reqContainsHealthcare = healthcareKeywords.some(keyword => reqText.includes(keyword));

    if (reqContainsHealthcare) {
      const storyContainsHealthcare = healthcareKeywords.some(keyword => storyText.includes(keyword));
      if (!storyContainsHealthcare) {
        return true; // Domain mismatch
      }
    }

    return false; // No domain mismatch detected
  }

  // Map a story to a requirement
  async mapStoryToRequirement(storyId, requirementId) {
    try {
      await db.execute(`
        INSERT INTO story_requirement_mappings (story_id, requirement_id)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE updated = CURRENT_TIMESTAMP
      `, [storyId, requirementId]);

      return true;
    } catch (error) {
      console.error('Error mapping story to requirement:', error);
      return false;
    }
  }

  // Remove mapping between story and requirement
  async unmapStoryFromRequirement(storyId, requirementId) {
    try {
      await db.execute(`
        DELETE FROM story_requirement_mappings
        WHERE story_id = ? AND requirement_id = ?
      `, [storyId, requirementId]);

      return true;
    } catch (error) {
      console.error('Error unmapping story from requirement:', error);
      return false;
    }
  }

  // Get stories mapped to a specific requirement
  async getStoriesForRequirement(requirementId) {
    try {
      const [stories] = await db.execute(`
        SELECT s.*, srm.created as mapped_at
        FROM star_stories s
        INNER JOIN story_requirement_mappings srm ON s.id = srm.story_id
        WHERE srm.requirement_id = ?
        ORDER BY srm.created DESC
      `, [requirementId]);

      return stories;
    } catch (error) {
      console.error('Error getting stories for requirement:', error);
      return [];
    }
  }
}

module.exports = new StoryMatchingService();