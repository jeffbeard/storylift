const db = require('../models/database');

class StoryMatchingService {
  // Find potential story matches for a list of requirements
  async findMatches(userId, requirements) {
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
        const potentialMatches = this.scoreStories(requirement, userStories);

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

  // Score stories based on similarity to requirement
  scoreStories(requirement, userStories) {
    const matches = [];

    for (const story of userStories) {
      const score = this.calculateSimilarityScore(requirement, story);

      // Only suggest stories with a reasonable similarity score
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

  // Simple text similarity scoring algorithm
  calculateSimilarityScore(requirement, story) {
    const reqText = `${requirement.title} ${requirement.description}`.toLowerCase();
    const storyText = `${story.title} ${story.description || ''} ${story.situation} ${story.task} ${story.action} ${story.result}`.toLowerCase();

    // Extract keywords from requirement
    const reqKeywords = this.extractKeywords(reqText);
    const storyKeywords = this.extractKeywords(storyText);

    if (reqKeywords.length === 0 || storyKeywords.length === 0) {
      return 0;
    }

    // Calculate intersection
    const intersection = reqKeywords.filter(keyword =>
      storyKeywords.some(storyKeyword =>
        storyKeyword.includes(keyword) || keyword.includes(storyKeyword)
      )
    );

    // Simple Jaccard similarity
    const union = new Set([...reqKeywords, ...storyKeywords]);
    return intersection.length / union.size;
  }

  // Extract meaningful keywords from text
  extractKeywords(text) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
    ]);

    return text
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/) // Split by whitespace
      .filter(word => word.length > 2 && !stopWords.has(word)) // Filter short words and stop words
      .map(word => word.toLowerCase());
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