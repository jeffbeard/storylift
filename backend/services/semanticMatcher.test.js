const SemanticMatcher = require('./semanticMatcher');

describe('SemanticMatcher', () => {
  let matcher;

  beforeAll(async () => {
    matcher = new SemanticMatcher();
    // Initialize once for all tests - this takes a few seconds
    await matcher.initialize();
  }, 30000); // 30 second timeout for model loading

  afterAll(() => {
    matcher.clearCache();
  });

  describe('CI/CD Matching', () => {
    test('should match CI/CD requirement with GitLab story', async () => {
      const requirement = {
        id: 1,
        title: 'CI/CD Experience',
        description: 'Experience with continuous integration and deployment pipelines'
      };

      const story = {
        id: 1,
        title: 'Migrated to GitLab Security Scanning systems',
        situation: 'GitLab\'s feature list grew significantly in the software security feature set to the extent that it became a viable replacement',
        task: 'Migrate existing security scanning processes',
        action: 'Implemented GitLab CI pipelines for automated security scanning',
        result: 'Reduced security scan time by 60% and improved pipeline reliability'
      };

      const similarity = await matcher.calculateSimilarity(requirement, story);

      console.log(`CI/CD -> GitLab similarity: ${similarity.toFixed(3)}`);
      expect(similarity).toBeGreaterThan(0.5); // Should be high similarity
    }, 10000);

    test('should not match healthcare requirement with non-healthcare story', async () => {
      const requirement = {
        id: 2,
        title: 'Healthcare IT Experience',
        description: 'Experience working in healthcare IT systems and compliance'
      };

      const story = {
        id: 2,
        title: 'Migrated to GitLab Security Scanning systems',
        situation: 'GitLab\'s feature list grew significantly in the software security feature set',
        task: 'Migrate existing security scanning processes',
        action: 'Implemented GitLab CI pipelines for automated security scanning',
        result: 'Reduced security scan time by 60%'
      };

      const similarity = await matcher.calculateSimilarity(requirement, story);

      console.log(`Healthcare -> GitLab similarity: ${similarity.toFixed(3)}`);
      expect(similarity).toBeLessThan(0.4); // Should be low similarity
    }, 10000);

    test('should match leadership requirement with team management story', async () => {
      const requirement = {
        id: 3,
        title: 'Team Leadership',
        description: 'Ability to motivate teams and keep work engaging while maintaining accountability'
      };

      const story = {
        id: 3,
        title: 'Infrastructure Product Management Function',
        situation: 'Because the business unit was an amalgam of six acquisitions, there were legacy team topologies',
        task: 'Establish unified product management processes',
        action: 'Led cross-functional teams to standardize infrastructure approaches',
        result: 'Improved team alignment and delivery velocity by 40%'
      };

      const similarity = await matcher.calculateSimilarity(requirement, story);

      console.log(`Leadership -> Team Management similarity: ${similarity.toFixed(3)}`);
      expect(similarity).toBeGreaterThan(0.4); // Should be moderate to high similarity
    }, 10000);
  });

  describe('Edge Cases', () => {
    test('should handle empty descriptions gracefully', async () => {
      const requirement = { id: 4, title: 'JavaScript Experience', description: '' };
      const story = { id: 4, title: 'Built React Application', description: '' };

      const similarity = await matcher.calculateSimilarity(requirement, story);

      expect(similarity).toBeGreaterThanOrEqual(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    test('should return consistent results for identical inputs', async () => {
      const requirement = { id: 5, title: 'Database Design', description: 'SQL and schema design' };
      const story = { id: 5, title: 'Optimized Database Performance', description: 'Redesigned database schema' };

      const similarity1 = await matcher.calculateSimilarity(requirement, story);
      const similarity2 = await matcher.calculateSimilarity(requirement, story);

      expect(Math.abs(similarity1 - similarity2)).toBeLessThan(0.001);
    });
  });

  describe('Performance', () => {
    test('should cache embeddings for performance', async () => {
      const requirement = { id: 6, title: 'Performance Optimization', description: 'Optimize system performance' };
      const story = { id: 6, title: 'Reduced Load Time', description: 'Optimized database queries', updated: '2024-01-01' };

      const start1 = Date.now();
      await matcher.calculateSimilarity(requirement, story);
      const time1 = Date.now() - start1;

      // Second call should be faster due to caching
      const start2 = Date.now();
      await matcher.calculateSimilarity(requirement, story);
      const time2 = Date.now() - start2;

      console.log(`First call: ${time1}ms, Second call: ${time2}ms`);
      expect(time2).toBeLessThan(time1); // Cached should be faster
    });
  });
});