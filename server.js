const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const jobRoutes = require('./backend/routes/jobs');
const requirementRoutes = require('./backend/routes/requirements');
const storyRoutes = require('./backend/routes/stories');
const userRoutes = require('./backend/routes/users');
const matchingRoutes = require('./backend/routes/matching');
const { globalLimiter, getRateLimitStatus } = require('./backend/middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy for correct IP in reverse-proxy setups
app.set('trust proxy', 1);

// Global rate limiting
app.use(globalLimiter);

// API Routes
app.use('/api/jobs', jobRoutes);
app.use('/api/requirements', requirementRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matching', matchingRoutes);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    rateLimit: getRateLimitStatus()
  });
});

app.listen(PORT, () => {
  console.log(`StoryLift server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});