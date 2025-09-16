import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <div className="hero">
        <h1>StoryLift</h1>
        <p className="hero-subtitle">
          Transform job requirements into compelling STAR stories
        </p>
        <p className="hero-description">
          Upload job descriptions, extract requirements automatically, and craft
          professional STAR format stories to elevate your career.
        </p>

        <div className="hero-actions">
          <Link to="/upload" className="btn btn-primary">
            Get Started
          </Link>
          <Link to="/jobs" className="btn btn-secondary">
            View Jobs
          </Link>
        </div>
      </div>

      <div className="features">
        <div className="feature">
          <h3>📄 Smart Extraction</h3>
          <p>Upload PDFs or URLs and let AI extract job requirements automatically</p>
        </div>

        <div className="feature">
          <h3>📝 STAR Framework</h3>
          <p>Structure your experiences using the proven Situation-Task-Action-Result format</p>
        </div>

        <div className="feature">
          <h3>💼 Career Management</h3>
          <p>Organize stories by job requirements and build your professional portfolio</p>
        </div>
      </div>
    </div>
  );
}

export default Home;