import React, { useState } from 'react';
import { requirementsAPI, storiesAPI } from '../services/api';
import './RequirementCard.css';

function RequirementCard({ requirement, stories, onCreateStory }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: requirement.title,
    description: requirement.description
  });
  const [expandedStories, setExpandedStories] = useState({});

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await requirementsAPI.update(requirement.id, editForm);
      requirement.title = editForm.title;
      requirement.description = editForm.description;
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating requirement:', error);
    }
  };

  const handleCancel = () => {
    setEditForm({
      title: requirement.title,
      description: requirement.description
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this requirement and all associated stories?')) {
      return;
    }

    try {
      await requirementsAPI.delete(requirement.id);
      window.location.reload(); // Simple refresh - in production you'd update state properly
    } catch (error) {
      console.error('Error deleting requirement:', error);
    }
  };

  const toggleStoryExpanded = (storyId) => {
    setExpandedStories(prev => ({
      ...prev,
      [storyId]: !prev[storyId]
    }));
  };

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm('Are you sure you want to delete this story?')) {
      return;
    }

    try {
      await storiesAPI.delete(storyId);
      window.location.reload(); // Simple refresh - in production you'd update state properly
    } catch (error) {
      console.error('Error deleting story:', error);
    }
  };

  return (
    <div className="requirement-card">
      <div className="requirement-header">
        <div className="requirement-type">
          {requirement.type === 'requirement' ? '📋' : '🎯'} {requirement.type}
        </div>
        <div className="requirement-actions">
          <button onClick={handleEdit} className="action-btn">✏️</button>
          <button onClick={handleDelete} className="action-btn delete">🗑️</button>
        </div>
      </div>

      {isEditing ? (
        <div className="edit-form">
          <input
            type="text"
            value={editForm.title}
            onChange={(e) => setEditForm({...editForm, title: e.target.value})}
            className="edit-input"
          />
          <textarea
            value={editForm.description}
            onChange={(e) => setEditForm({...editForm, description: e.target.value})}
            className="edit-textarea"
          />
          <div className="edit-actions">
            <button onClick={handleSave} className="btn btn-primary btn-sm">Save</button>
            <button onClick={handleCancel} className="btn btn-secondary btn-sm">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="requirement-content">
          <h4>{requirement.title}</h4>
          <p>{requirement.description}</p>
        </div>
      )}

      <div className="stories-section">
        <div className="stories-header">
          <span>Stories ({stories.length})</span>
          <button onClick={onCreateStory} className="btn btn-primary btn-sm">
            + Add Story
          </button>
        </div>

        {stories.length > 0 && (
          <div className="stories-list">
            {stories.map(story => (
              <div key={story.id} className="story-item">
                <div className="story-header" onClick={() => toggleStoryExpanded(story.id)}>
                  <span>Story {story.id}</span>
                  <div className="story-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStory(story.id);
                      }}
                      className="action-btn delete"
                    >
                      🗑️
                    </button>
                    <span className="expand-icon">
                      {expandedStories[story.id] ? '▼' : '▶'}
                    </span>
                  </div>
                </div>

                {expandedStories[story.id] && (
                  <div className="story-content">
                    {story.situation && <div><strong>Situation:</strong> {story.situation}</div>}
                    {story.task && <div><strong>Task:</strong> {story.task}</div>}
                    {story.action && <div><strong>Action:</strong> {story.action}</div>}
                    {story.result && <div><strong>Result:</strong> {story.result}</div>}
                    {story.notes && <div><strong>Notes:</strong> {story.notes}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RequirementCard;