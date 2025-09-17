# StoryLift 📝

<div align="center">
  <img src="sage_owl_mascot.png" alt="Sage the Mentor Owl - StoryLift Mascot" width="200" height="150">
</div>

> Transform job requirements into compelling STAR stories with AI-powered extraction

StoryLift is a full-stack web application that helps job seekers create professional STAR-format (Situation, Task, Action, Result) stories by automatically extracting requirements and qualifications from job descriptions using Claude AI.

## ✨ Features

- **Smart Extraction**: Upload PDFs or job posting URLs and let AI extract requirements automatically
- **STAR Framework**: Structured story creation using the proven interview format
- **Job Management**: Organize multiple job applications and their requirements
- **Full CRUD Operations**: Edit, update, and delete jobs, requirements, and stories
- **Modern UI**: Clean, responsive React interface with intuitive navigation
- **Real-time Processing**: Instant AI analysis of job descriptions

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MySQL** (v8.0 or higher) - [Download here](https://dev.mysql.com/downloads/)
- **Claude API Key** - [Get one here](https://console.anthropic.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd storylift
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   npm install

   # Install frontend dependencies
   cd frontend && npm install && cd ..
   ```

3. **Set up the database**
   ```bash
   # Create and initialize the database
   mysql -u root -e "CREATE DATABASE IF NOT EXISTS storylift;"
   mysql -u root storylift < database/schema.sql
   ```

4. **Configure environment variables**
   ```bash
   # Copy the example env file
   cp .env.example .env

   # Edit .env with your Claude API key
   # CLAUDE_API_KEY=your_actual_api_key_here
   ```

5. **Start the application**
   ```bash
   # Terminal 1: Start the backend server
   npm start

   # Terminal 2: Start the frontend development server
   npm run frontend
   ```

6. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 18 with Hooks
- React Router for navigation
- Axios for API communication
- CSS Modules for styling

**Backend:**
- Node.js with Express.js
- MySQL with mysql2 driver
- Multer for file uploads
- Claude API for AI processing

**Database:**
- MySQL with relational schema
- Three main entities: Jobs → Requirements → Stories

### Project Structure

```
storylift/
├── backend/                 # Backend API logic
│   ├── models/             # Database connection
│   ├── routes/             # API routes (jobs, requirements, stories)
│   └── services/           # Claude API integration
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   └── services/       # API client
├── database/               # Database schema and migrations
├── uploads/                # Uploaded PDF storage
├── server.js              # Express server entry point
└── package.json           # Backend dependencies
```

## 🔧 Development

### Available Scripts

**Backend:**
- `npm start` - Start production server
- `npm run dev` - Start development server
- `npm run build` - Build frontend for production

**Frontend:**
- `npm run frontend` - Start React development server
- `cd frontend && npm test` - Run tests
- `cd frontend && npm run build` - Build for production

### Development Workflow

1. **Make changes** to backend (`/backend`) or frontend (`/frontend/src`)
2. **Test locally** using the development servers
3. **Commit changes** following conventional commit format
4. **Submit pull request** for review

### API Testing

Use curl or your favorite API client:

```bash
# Health check
curl http://localhost:3001/api/health

# Get all jobs
curl http://localhost:3001/api/jobs

# Upload job via URL
curl -X POST http://localhost:3001/api/jobs/upload-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/job", "company": "Example Corp", "role": "Software Engineer"}'
```

## 🔐 Environment Configuration

Create a `.env` file in the root directory:

```bash
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=storylift

# Server Configuration
PORT=3001

# Claude AI Configuration
CLAUDE_API_KEY=sk-ant-api03-your-actual-key-here
```

## 📖 Usage Guide

### 1. Upload Job Description
- Navigate to `/upload`
- Choose between PDF upload or URL import
- Fill in company name and role title
- Click "Upload & Extract Requirements"

### 2. Review Extracted Requirements
- Visit `/jobs` to see all uploaded positions
- Click on any job to view extracted requirements and qualifications
- Edit or delete requirements as needed

### 3. Create STAR Stories
- Click "Add Story" next to any requirement
- Fill out the STAR format fields:
  - **Situation**: Context and background
  - **Task**: What needed to be done
  - **Action**: Steps you took
  - **Result**: Outcome and impact
- Save your story for future interviews

### 4. Manage Your Portfolio
- View all stories organized by job requirements
- Edit existing stories to improve them
- Delete jobs and stories you no longer need

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error:**
```bash
# Ensure MySQL is running
brew services start mysql  # macOS
sudo systemctl start mysql # Linux

# Check if database exists
mysql -u root -e "SHOW DATABASES LIKE 'storylift';"
```

**Claude API Error:**
- Verify your API key is correct in `.env`
- Check your API usage limits
- Ensure you have access to Claude 3.5 Sonnet

**Frontend Won't Start:**
```bash
# Clear React cache
cd frontend && npm start -- --reset-cache
```

**Port Already in Use:**
```bash
# Find and kill process using the port
lsof -ti:3001 | xargs kill -9  # Backend
lsof -ti:3000 | xargs kill -9  # Frontend
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Style

- Use ESLint and Prettier for consistent formatting
- Follow conventional commit messages
- Write tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Claude AI** by Anthropic for intelligent requirement extraction
- **React** team for the amazing frontend framework
- **Express.js** community for the robust backend framework
- **STAR method** for providing a proven interview storytelling framework

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with detailed information

---

**Built with ❤️ using Claude Code**