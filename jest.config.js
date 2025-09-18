module.exports = {
  testEnvironment: 'node',
  transformIgnorePatterns: [
    'node_modules/(?!(@xenova/transformers|onnxruntime-node)/)'
  ],
  moduleFileExtensions: ['js', 'json'],
  collectCoverageFrom: [
    'backend/services/**/*.js',
    '!backend/services/**/*.test.js'
  ],
  testMatch: [
    '**/backend/services/**/*.test.js'
  ],
  setupFilesAfterEnv: [],
  testTimeout: 60000, // 60 seconds for ML model loading
  extensionsToTreatAsEsm: [],
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
};