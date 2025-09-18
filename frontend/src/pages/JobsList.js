import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jobsAPI } from '../services/api';
import { useUser } from '../contexts/UserContext';
import './JobsList.css';

function JobsList() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { user, isAuthenticated, loading: userLoading } = useUser();

  // Redirect if not authenticated
  useEffect(() => {
    if (!userLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, userLoading, navigate]);

  useEffect(() => {
    if (user && isAuthenticated) {
      loadJobs();
    }
  }, [user, isAuthenticated]);

  const loadJobs = async () => {
    if (!user) return;

    try {
      const response = await jobsAPI.getByUserId(user.id);
      setJobs(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
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

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job description and all related data?')) {
      return;
    }

    try {
      await jobsAPI.delete(jobId);
      setJobs(jobs.filter(job => job.id !== jobId));
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">Loading jobs...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="jobs-list">
      <div className="jobs-header">
        <h1>My Job Descriptions</h1>
        <Link to="/upload" className="btn btn-primary">
          Add New Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="empty-state">
          <h3>No job descriptions yet</h3>
          <p>Upload your first job description to get started with creating STAR stories.</p>
          <Link to="/upload" className="btn btn-primary">
            Upload Job Description
          </Link>
        </div>
      ) : (
        <div className="jobs-grid">
          {jobs.map(job => (
            <div key={job.id} className="job-card">
              <div className="job-card-header">
                <h3>{job.role_name}</h3>
                <span className="company-name">{job.company_name}</span>
              </div>

              <div className="job-card-meta">
                <span className="source-type">
                  {job.source_type === 'pdf' ? '📄 PDF' : '🔗 URL'}
                </span>
                <span className="date">
                  {formatDate(job.created)}
                </span>
              </div>

              <div className="job-card-actions">
                <Link
                  to={`/jobs/${job.id}`}
                  className="btn btn-secondary"
                >
                  View Details
                </Link>
                <button
                  onClick={() => handleDelete(job.id)}
                  className="btn btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default JobsList;