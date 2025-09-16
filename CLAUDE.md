# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StoryLift is a web application that helps users create STAR-format stories based on job requirements and qualifications extracted from job descriptions. The application accepts PDF uploads or URLs to job descriptions, extracts requirements using the Claude API, and provides an interface for users to write and manage their STAR stories.

## Technology Stack

- **Frontend**: React with a modern UI design framework
- **Backend**: JavaScript/Node.js
- **Database**: MySQL (local instance named 'storylift', root user, no password)
- **AI Integration**: Claude API for requirement extraction from job descriptions

## Database Schema Design

The application follows a hierarchical data model:
- Job Descriptions (company name, role name, source document)
- Requirements/Qualifications (linked to job descriptions)
- STAR Stories (linked to specific requirements/qualifications)

All tables require `created` and `updated` timestamp columns.

## Architecture Principles

- **Simplicity First**: Keep the codebase as small and simple as possible
- **Minimal Dependencies**: Limit external dependencies to essential ones only
- **CRUD Focus**: This is fundamentally a CRUD application - avoid over-engineering
- **Live Coding Ready**: Structure should support rapid development and iteration

## Core Features

1. **Upload Interface**: Accept PDF files or URLs for job descriptions
2. **Extraction**: Use Claude API to parse requirements and qualifications
3. **Job Management**: List view with drill-down to individual job descriptions
4. **Story Creation**: STAR format story input interface for each requirement
5. **Full CRUD**: Edit/delete capabilities for all entities (jobs, requirements, stories)

## Development Approach

- Focus on intuitive, simple UI design
- Prioritize functionality over complexity
- Maintain clear separation between frontend and backend components
- Design for easy user workflow from upload to story completion

## Commands

### Development
- `npm start` - Start backend server (port 3001)
- `npm run frontend` - Start React development server (port 3000)
- `npm run build` - Build React app for production

### Database Setup
- `mysql -u root storylift < database/schema.sql` - Initialize database schema

### Testing
- Backend API: http://localhost:3001/api
- Frontend: http://localhost:3000
- Health check: `curl http://localhost:3001/api/health`

## Database Connection

Connect to local MySQL instance:
- Host: localhost
- Database: storylift
- User: root
- Password: (none)

## File Structure

- `/server.js` - Express server entry point
- `/backend/` - API routes and services
- `/frontend/` - React application
- `/database/schema.sql` - Database schema
- `/.env` - Environment configuration