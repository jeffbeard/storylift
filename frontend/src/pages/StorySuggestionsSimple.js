import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { jobsAPI, matchingAPI } from '../services/api';

function StorySuggestionsSimple() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: userLoading } = useUser();

  const [jobData, setJobData] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!userLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, userLoading, navigate]);

  // Load job data and suggestions when user is authenticated
  useEffect(() => {
    if (user && isAuthenticated) {
      loadData();
    }
  }, [user, isAuthenticated, jobId]);

  const loadData = async () => {
    try {
      setLoading(true);
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

  // Show loading while checking authentication
  if (userLoading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading job data and suggestions...</div>;
  }

  if (error) {
    return <div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Story Suggestions</h1>
      <p>Job ID: {jobId}</p>
      <p>User: {user?.first_name} (ID: {user?.id})</p>
      <p>Authentication check passed!</p>

      {jobData && (
        <div>
          <h2>Job Data:</h2>
          <p>Company: {jobData.job?.company_name}</p>
          <p>Role: {jobData.job?.role_name}</p>
          <p>Status: {jobData.job?.status}</p>
        </div>
      )}

      {suggestions && (
        <div>
          <h2>Suggestions Data:</h2>
          <p>Total Requirements: {suggestions.total_requirements}</p>
          <p>Requirements with Suggestions: {suggestions.requirements_with_suggestions}</p>
          <p>Number of Suggestions: {suggestions.suggestions?.length || 0}</p>
        </div>
      )}

      <p>Both API calls working! The issue is likely in the full component's rendering or event handlers.</p>
    </div>
  );
}

export default StorySuggestionsSimple;