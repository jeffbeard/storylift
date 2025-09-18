-- Migration: Add User Management and Story-Requirement Mapping
-- This migration adds users and changes how stories relate to requirements

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add user_id to star_stories and remove direct requirement link
ALTER TABLE star_stories
ADD COLUMN user_id INT NOT NULL,
ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN description TEXT,
ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Create story-requirement mapping table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS story_requirement_mappings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    story_id INT NOT NULL,
    requirement_id INT NOT NULL,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES star_stories(id) ON DELETE CASCADE,
    FOREIGN KEY (requirement_id) REFERENCES requirements(id) ON DELETE CASCADE,
    UNIQUE KEY unique_story_requirement (story_id, requirement_id)
);

-- Add user_id to job_descriptions to track ownership
ALTER TABLE job_descriptions
ADD COLUMN user_id INT NOT NULL,
ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_star_stories_user_id ON star_stories(user_id);
CREATE INDEX idx_story_mappings_story_id ON story_requirement_mappings(story_id);
CREATE INDEX idx_story_mappings_requirement_id ON story_requirement_mappings(requirement_id);
CREATE INDEX idx_job_descriptions_user_id ON job_descriptions(user_id);