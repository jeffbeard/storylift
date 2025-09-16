# StoryLift

A web application that helps users create STAR-format stories based on job requirements and qualifications extracted from job descriptions.

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MySQL running locally
- Database named `storylift` (created automatically)

### Installation & Launch

1. **Setup Database**
   ```bash
   mysql -u root storylift < database/schema.sql
   ```

2. **Install Dependencies**
   ```bash
   npm install
   cd frontend && npm install
   cd ..
   ```

3. **Start Backend Server** (in one terminal)
   ```bash
   npm start
   ```
   Server runs on http://localhost:3001

4. **Start Frontend Development Server** (in another terminal)
   ```bash
   npm run frontend
   ```
   Frontend runs on http://localhost:3000

### Usage

1. **Upload Job Description**: Go to `/upload` and either upload a PDF or provide a URL
2. **View Jobs**: Visit `/jobs` to see all uploaded job descriptions
3. **Create Stories**: Click into any job to see extracted requirements and create STAR stories
4. **Manage**: Edit requirements/qualifications and delete stories as needed

### API Endpoints

- `GET /api/health` - Health check
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get job with requirements
- `POST /api/jobs/upload-pdf` - Upload PDF job description
- `POST /api/jobs/upload-url` - Add job from URL
- `POST /api/stories` - Create STAR story
- `PUT /api/stories/:id` - Update story
- `DELETE /api/stories/:id` - Delete story

### Configuration

- Database connection: `.env` file (root/root@localhost)
- Claude API key: Set `CLAUDE_API_KEY` in `.env` for AI extraction
- Default ports: Backend (3001), Frontend (3000)