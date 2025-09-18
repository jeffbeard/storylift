import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { matchingAPI, jobsAPI } from '../services/api';
import { useUser } from '../contexts/UserContext';
import './StorySuggestions.css';

function StorySuggestions() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: userLoading } = useUser();

  const [jobData, setJobData] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mappingLoading, setMappingLoading] = useState({});

  // Redirect if not authenticated
  useEffect(() => {
    if (!userLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, userLoading, navigate]);

  useEffect(() => {
    if (user && isAuthenticated) {
      loadData();
    }
  }, [user, isAuthenticated, jobId]);

  const loadData = async () => {
    try {
      // Load job details and suggestions in parallel
      const [jobResponse, suggestionsResponse] = await Promise.all([
        jobsAPI.getById(jobId),
        matchingAPI.getSuggestions(jobId, user.id)
      ]);

      setJobData(jobResponse.data);
      setSuggestions(suggestionsResponse.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMapStory = async (storyId, requirementId) => {
    const mappingKey = `${storyId}-${requirementId}`;
    setMappingLoading(prev => ({ ...prev, [mappingKey]: true }));

    try {
      await matchingAPI.mapStoryToRequirement(storyId, requirementId);

      // Update the suggestions to reflect the new mapping
      setSuggestions(prev => ({
        ...prev,
        suggestions: prev.suggestions.map(suggestion => ({
          ...suggestion,
          recommended_stories: suggestion.recommended_stories.map(story =>
            story.id === storyId && suggestion.requirement.id === requirementId
              ? { ...story, already_mapped: true }
              : story
          )
        }))
      }));
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setMappingLoading(prev => ({ ...prev, [mappingKey]: false }));
    }
  };

  // Show loading while checking authentication
  if (userLoading) {
    return <div className="loading">Loading...</div>;
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return <div className="loading">Loading suggestions...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!jobData || !suggestions) {
    return <div className="error">Job or suggestions not found</div>;
  }

  const { job } = jobData;

  return (
    <div className="story-suggestions">
      <div className="suggestions-header">
        <button onClick={() => navigate(`/jobs/${jobId}`)} className="back-btn">
          ← Back to Job Details
        </button>

        <div className="job-info">
          <h1>Story Suggestions</h1>
          <h2>{job.role_name} at {job.company_name}</h2>

          <div className="suggestions-summary">
            <div className="summary-stat">
              <span className="stat-number">{suggestions.total_requirements}</span>
              <span className="stat-label">Total Requirements</span>
            </div>
            <div className="summary-stat">
              <span className="stat-number">{suggestions.requirements_with_suggestions}</span>
              <span className="stat-label">With Suggestions</span>
            </div>
          </div>
        </div>
      </div>

      {suggestions.suggestions.length === 0 ? (
        <div className="empty-state">
          <h3>No story suggestions available</h3>
          <p>
            We couldn't find any existing stories that match the job requirements.
            You may need to create new STAR stories for this position.
          </p>
          <Link to={`/jobs/${jobId}`} className="btn btn-primary">
            Go to Job Details
          </Link>
        </div>
      ) : (
        <div className="suggestions-content">
          {suggestions.suggestions.map(suggestion => (
            <div key={suggestion.requirement.id} className="requirement-suggestions">
              <div className="requirement-header">
                <h3>{suggestion.requirement.title}</h3>
                <p className="requirement-description">
                  {suggestion.requirement.description}
                </p>
              </div>

              <div className="suggested-stories">
                <h4>Recommended Stories ({suggestion.recommended_stories.length})</h4>

                {suggestion.recommended_stories.map(story => {
                  const mappingKey = `${story.id}-${suggestion.requirement.id}`;
                  const isMapping = mappingLoading[mappingKey];

                  return (
                    <div
                      key={story.id}
                      className={`story-suggestion ${story.already_mapped ? 'mapped' : ''}`}
                    >
                      <div className="story-info">
                        <div className="story-header">
                          <h5>{story.title}</h5>
                          <div className="story-meta">
                            <span className="match-score">
                              {story.match_score}% match
                            </span>
                            {story.already_mapped && (
                              <span className="mapped-badge">Already Mapped</span>
                            )}
                          </div>
                        </div>

                        <p className="story-preview">{story.preview}</p>
                      </div>

                      <div className="story-actions">
                        <Link
                          to={`/stories/${story.id}`}
                          className="btn btn-secondary btn-small"
                        >
                          View Full Story
                        </Link>

                        {!story.already_mapped && (
                          <button
                            onClick={() => handleMapStory(story.id, suggestion.requirement.id)}
                            className="btn btn-primary btn-small"
                            disabled={isMapping}
                          >
                            {isMapping ? 'Mapping...' : 'Use This Story'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StorySuggestions;