-- StoryLift Database Schema
-- Run this script to create the database structure

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS storylift;
USE storylift;

-- Job Descriptions table
CREATE TABLE IF NOT EXISTS job_descriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(255) NOT NULL,
    role_name VARCHAR(255) NOT NULL,
    source_type ENUM('pdf', 'url') NOT NULL,
    source_data TEXT,
    original_content LONGTEXT,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Requirements/Qualifications table
CREATE TABLE IF NOT EXISTS requirements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    job_description_id INT NOT NULL,
    type ENUM('requirement', 'qualification') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (job_description_id) REFERENCES job_descriptions(id) ON DELETE CASCADE
);

-- STAR Stories table
CREATE TABLE IF NOT EXISTS star_stories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    requirement_id INT NOT NULL,
    situation TEXT,
    task TEXT,
    action TEXT,
    result TEXT,
    notes TEXT,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (requirement_id) REFERENCES requirements(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_requirements_job_id ON requirements(job_description_id);
CREATE INDEX idx_stories_requirement_id ON star_stories(requirement_id);
CREATE INDEX idx_job_descriptions_created ON job_descriptions(created);