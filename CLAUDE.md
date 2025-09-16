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
## Versioning and Release Conventions

**Semantic Versioning (SemVer):**
- Follow semantic versioning format: `MAJOR.MINOR.PATCH`
- **MAJOR**: Breaking changes that are not backward compatible
- **MINOR**: New features that are backward compatible
- **PATCH**: Bug fixes that are backward compatible
- Examples: `1.0.0`, `1.2.3`, `2.0.0-beta.1`

**Tag Creation Workflow:**
- Create tags only from the `main` branch after thorough testing
- Use annotated tags with release notes: `git tag -a v1.2.0 -m "Release v1.2.0: Add STAR story export feature"`
- Tag naming: Always prefix with `v` (e.g., `v1.0.0`, `v2.1.3`)
- Push tags to remote: `git push origin --tags`
- **When to tag:**
  - PATCH: After bugfix merges that warrant a release
  - MINOR: After feature completion and testing
  - MAJOR: After breaking changes are fully implemented and documented

## Branch and Commit Conventions

**IMPORTANT**: Always follow these conventions when creating branches and commits.

**Branch Naming:**
- `feature/<short-name>` - New features or enhancements
- `bugfix/<short-name>` - Bug fixes

**Branch Lifecycle:**
- **Create**: `git checkout -b feature/user-authentication`
- **Work**: Make commits following the commit message format
- **Merge**: Create pull request to `main` branch
- **Cleanup**: Delete branch after successful merge
  - Local: `git branch -d feature/user-authentication`
  - Remote: `git push origin --delete feature/user-authentication`
- **Long-lived branches**: Only `main` should be permanent
- **Stale branches**: Delete feature branches older than 30 days if not merged

**Commit Message Format:**
```
<type>: <description>

[optional body]
```

**Allowed Commit Types (use exactly these prefixes):**
- `feature:` - New functionality or enhancements
- `bugfix:` - Bug fixes
- `chore:` - Maintenance tasks, dependency updates
- `docs:` - Documentation changes
- `refactor:` - Code improvements without changing functionality
- `test:` - Adding or updating tests
- `perf:` - Performance improvements
- `ci:` - CI/CD pipeline changes

## Release Process

**Release Workflow:**
1. **Prepare Release**
   - Ensure all features for the version are merged to `main`
   - Run full test suite: `npm test && cd frontend && npm test`
   - Update version in `package.json` if needed

2. **Create Release**
   - Create and push annotated tag: `git tag -a v1.2.0 -m "Release notes"`
   - Build production assets: `npm run build`

3. **Deploy** (when ready)
   - Deploy from tagged version, not from `main`
   - Update deployment documentation

4. **Post-Release**
   - Monitor for critical issues
   - Create hotfix branches from tags if urgent fixes needed: `git checkout -b hotfix/critical-bug v1.2.0`

**Release Types:**
- **Patch releases**: Can be created immediately after bugfixes
- **Minor releases**: Weekly or bi-weekly feature releases
- **Major releases**: Planned releases with breaking changes (coordinate with users)

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
