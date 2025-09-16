const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const db = require('../models/database');
const claudeService = require('../services/claudeService');

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

// Get all job descriptions
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, company_name, role_name, source_type, created FROM job_descriptions ORDER BY created DESC'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single job description with requirements
router.get('/:id', async (req, res) => {
  try {
    const [jobRows] = await db.execute(
      'SELECT * FROM job_descriptions WHERE id = ?',
      [req.params.id]
    );

    if (jobRows.length === 0) {
      return res.status(404).json({ error: 'Job description not found' });
    }

    const [requirementRows] = await db.execute(
      'SELECT * FROM requirements WHERE job_description_id = ? ORDER BY type, title',
      [req.params.id]
    );

    res.json({
      job: jobRows[0],
      requirements: requirementRows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload PDF job description
router.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);
    const content = pdfData.text;

    // Extract company and role from form data or content
    const companyName = req.body.company || 'Unknown Company';
    const roleName = req.body.role || 'Unknown Role';

    // Insert job description
    const [jobResult] = await db.execute(
      'INSERT INTO job_descriptions (company_name, role_name, source_type, source_data, original_content) VALUES (?, ?, ?, ?, ?)',
      [companyName, roleName, 'pdf', req.file.filename, content]
    );

    const jobId = jobResult.insertId;

    // Extract requirements using Claude API
    const extracted = await claudeService.extractRequirements(content);

    // Insert requirements and qualifications
    for (const req of extracted.requirements) {
      await db.execute(
        'INSERT INTO requirements (job_description_id, type, title, description) VALUES (?, ?, ?, ?)',
        [jobId, 'requirement', req.title, req.description]
      );
    }

    for (const qual of extracted.qualifications) {
      await db.execute(
        'INSERT INTO requirements (job_description_id, type, title, description) VALUES (?, ?, ?, ?)',
        [jobId, 'qualification', qual.title, qual.description]
      );
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ jobId, message: 'Job description uploaded and processed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add job description from URL
router.post('/upload-url', async (req, res) => {
  try {
    const { url, company, role } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Fetch content from URL
    const response = await axios.get(url);
    const content = response.data;

    // Simple text extraction (in production, you'd want better HTML parsing)
    let textContent = '';
    if (typeof content === 'string') {
      textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    } else {
      textContent = JSON.stringify(content, null, 2);
    }

    const companyName = company || 'Unknown Company';
    const roleName = role || 'Unknown Role';

    // Insert job description
    const [jobResult] = await db.execute(
      'INSERT INTO job_descriptions (company_name, role_name, source_type, source_data, original_content) VALUES (?, ?, ?, ?, ?)',
      [companyName, roleName, 'url', url, textContent]
    );

    const jobId = jobResult.insertId;

    // Extract requirements using Claude API
    const extracted = await claudeService.extractRequirements(textContent);

    // Insert requirements and qualifications
    for (const req of extracted.requirements) {
      await db.execute(
        'INSERT INTO requirements (job_description_id, type, title, description) VALUES (?, ?, ?, ?)',
        [jobId, 'requirement', req.title, req.description]
      );
    }

    for (const qual of extracted.qualifications) {
      await db.execute(
        'INSERT INTO requirements (job_description_id, type, title, description) VALUES (?, ?, ?, ?)',
        [jobId, 'qualification', qual.title, qual.description]
      );
    }

    res.json({ jobId, message: 'Job description processed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete job description
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.execute(
      'DELETE FROM job_descriptions WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Job description not found' });
    }

    res.json({ message: 'Job description deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;