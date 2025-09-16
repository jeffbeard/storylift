class SemanticMatcher {
  constructor() {
    this.embedder = null;
    this.initialized = false;
    this.embeddingCache = new Map();
    this.transformers = null;
  }

  async initialize() {
    if (!this.initialized) {
      console.log('Loading semantic similarity model...');

      // Dynamic import for ES module
      this.transformers = await import('@xenova/transformers');

      this.embedder = await this.transformers.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      this.initialized = true;
      console.log('Semantic similarity model loaded');
    }
  }

  async calculateSimilarity(requirement, story) {
    await this.initialize();

    const reqText = `${requirement.title} ${requirement.description || ''}`.trim();
    const storyText = `${story.title} ${story.description || ''} ${story.situation || ''} ${story.task || ''} ${story.action || ''} ${story.result || ''}`.trim();

    // Get cached or compute embeddings
    const reqEmbedding = await this.getEmbedding(reqText, `req_${requirement.id}_${JSON.stringify(requirement).length}`);
    const storyEmbedding = await this.getEmbedding(storyText, `story_${story.id}_${story.updated || story.id}`);

    return this.cosineSimilarity(reqEmbedding, storyEmbedding);
  }

  async getEmbedding(text, cacheKey) {
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey);
    }

    const [embedding] = await this.embedder(text, {
      pooling: 'mean',
      normalize: true
    });

    this.embeddingCache.set(cacheKey, embedding.data);

    // Keep cache size reasonable
    if (this.embeddingCache.size > 1000) {
      const firstKey = this.embeddingCache.keys().next().value;
      this.embeddingCache.delete(firstKey);
    }

    return embedding.data;
  }

  cosineSimilarity(a, b) {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  // Clear cache to free memory if needed
  clearCache() {
    this.embeddingCache.clear();
  }
}

module.exports = SemanticMatcher;