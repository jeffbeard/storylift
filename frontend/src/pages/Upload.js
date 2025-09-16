import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI } from '../services/api';
import { useUser } from '../contexts/UserContext';
import './Upload.css';

function Upload() {
  const [uploadType, setUploadType] = useState('pdf');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    url: '',
    file: null
  });

  const navigate = useNavigate();
  const { user, isAuthenticated, loading: userLoading } = useUser();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!userLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, userLoading, navigate]);

  // Show loading while checking authentication
  if (userLoading) {
    return <div className="upload"><div className="upload-container">Loading...</div></div>;
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      file: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!user) {
      setError('You must be logged in to upload jobs');
      setLoading(false);
      return;
    }

    try {
      let result;

      if (uploadType === 'pdf') {
        if (!formData.file) {
          throw new Error('Please select a PDF file');
        }

        const data = new FormData();
        data.append('pdf', formData.file);
        data.append('company', formData.company);
        data.append('role', formData.role);
        data.append('user_id', user.id.toString());

        result = await jobsAPI.uploadPDF(data);
      } else {
        if (!formData.url) {
          throw new Error('Please enter a URL');
        }

        result = await jobsAPI.uploadURL({
          url: formData.url,
          company: formData.company,
          role: formData.role,
          user_id: user.id
        });
      }

      navigate(`/jobs/${result.data.jobId}/suggestions`);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload">
      <div className="upload-container">
        <h1>Upload Job Description</h1>

        <div className="upload-type-selector">
          <button
            type="button"
            className={`type-btn ${uploadType === 'pdf' ? 'active' : ''}`}
            onClick={() => setUploadType('pdf')}
          >
            📄 Upload PDF
          </button>
          <button
            type="button"
            className={`type-btn ${uploadType === 'url' ? 'active' : ''}`}
            onClick={() => setUploadType('url')}
          >
            🔗 From URL
          </button>
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label htmlFor="company">Company Name</label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              placeholder="e.g. Google, Microsoft, Amazon"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role/Position</label>
            <input
              type="text"
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              placeholder="e.g. Software Engineer, Product Manager"
            />
          </div>

          {uploadType === 'pdf' ? (
            <div className="form-group">
              <label htmlFor="file">PDF File</label>
              <input
                type="file"
                id="file"
                name="file"
                accept=".pdf"
                onChange={handleFileChange}
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="url">Job Description URL</label>
              <input
                type="url"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                placeholder="https://company.com/careers/job-posting"
                required
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Processing...' : 'Upload & Extract Requirements'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Upload;