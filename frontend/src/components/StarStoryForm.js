import React, { useState } from 'react';
import { storiesAPI } from '../services/api';
import './StarStoryForm.css';

function StarStoryForm({ requirement, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    situation: '',
    task: '',
    action: '',
    result: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await storiesAPI.create({
        requirement_id: requirement.id,
        ...formData
      });
      onSubmit();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create STAR Story</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="requirement-info">
          <h3>{requirement.title}</h3>
          <p>{requirement.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="star-form">
          <div className="form-group">
            <label htmlFor="situation">
              <strong>Situation</strong>
              <span className="field-description">Describe the context and background</span>
            </label>
            <textarea
              id="situation"
              name="situation"
              value={formData.situation}
              onChange={handleInputChange}
              placeholder="What was the situation or challenge you faced?"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="task">
              <strong>Task</strong>
              <span className="field-description">What needed to be done?</span>
            </label>
            <textarea
              id="task"
              name="task"
              value={formData.task}
              onChange={handleInputChange}
              placeholder="What was your responsibility or goal?"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="action">
              <strong>Action</strong>
              <span className="field-description">What specific actions did you take?</span>
            </label>
            <textarea
              id="action"
              name="action"
              value={formData.action}
              onChange={handleInputChange}
              placeholder="What steps did you take to address the task?"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label htmlFor="result">
              <strong>Result</strong>
              <span className="field-description">What was the outcome?</span>
            </label>
            <textarea
              id="result"
              name="result"
              value={formData.result}
              onChange={handleInputChange}
              placeholder="What was achieved? Include metrics if possible."
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">
              <strong>Notes</strong>
              <span className="field-description">Additional context or learnings</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Any additional context, learnings, or key points to remember"
              rows="2"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : 'Save Story'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StarStoryForm;