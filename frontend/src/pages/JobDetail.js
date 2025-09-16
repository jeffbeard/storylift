import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobsAPI, storiesAPI } from '../services/api';
import StarStoryForm from '../components/StarStoryForm';
import RequirementCard from '../components/RequirementCard';
import './JobDetail.css';

function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [jobData, setJobData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [stories, setStories] = useState({});

  useEffect(() => {
    loadJobData();
  }, [id]);

  const loadJobData = async () => {
    try {
      const response = await jobsAPI.getById(id);
      setJobData(response.data);
      await loadStoriesForRequirements(response.data.requirements);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStoriesForRequirements = async (requirements) => {
    const storiesData = {};

    for (const req of requirements) {
      try {
        const response = await storiesAPI.getByRequirementId(req.id);
        storiesData[req.id] = response.data;
      } catch (err) {
        storiesData[req.id] = [];
      }
    }

    setStories(storiesData);
  };

  const handleCreateStory = (requirement) => {
    setSelectedRequirement(requirement);
    setShowStoryForm(true);
  };

  const handleStorySubmitted = () => {
    setShowStoryForm(false);
    setSelectedRequirement(null);
    loadStoriesForRequirements(jobData.requirements);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">Loading job details...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!jobData) {
    return <div className="error">Job not found</div>;
  }

  const { job, requirements } = jobData;
  const requirementsList = requirements.filter(req => req.type === 'requirement');
  const qualificationsList = requirements.filter(req => req.type === 'qualification');

  return (
    <div className="job-detail">
      <div className="job-header">
        <button onClick={() => navigate('/jobs')} className="back-btn">
          ← Back to Jobs
        </button>

        <div className="job-info">
          <h1>{job.role_name}</h1>
          <h2>{job.company_name}</h2>
          <div className="job-meta">
            <span className="source-type">
              {job.source_type === 'pdf' ? '📄 PDF Upload' : '🔗 URL Import'}
            </span>
            <span className="date">Added {formatDate(job.created)}</span>
          </div>
        </div>
      </div>

      <div className="requirements-sections">
        <div className="requirements-section">
          <h3>Requirements ({requirementsList.length})</h3>
          <div className="requirements-grid">
            {requirementsList.map(requirement => (
              <RequirementCard
                key={requirement.id}
                requirement={requirement}
                stories={stories[requirement.id] || []}
                onCreateStory={() => handleCreateStory(requirement)}
              />
            ))}
          </div>
        </div>

        <div className="requirements-section">
          <h3>Qualifications ({qualificationsList.length})</h3>
          <div className="requirements-grid">
            {qualificationsList.map(qualification => (
              <RequirementCard
                key={qualification.id}
                requirement={qualification}
                stories={stories[qualification.id] || []}
                onCreateStory={() => handleCreateStory(qualification)}
              />
            ))}
          </div>
        </div>
      </div>

      {showStoryForm && selectedRequirement && (
        <StarStoryForm
          requirement={selectedRequirement}
          onClose={() => setShowStoryForm(false)}
          onSubmit={handleStorySubmitted}
        />
      )}
    </div>
  );
}

export default JobDetail;