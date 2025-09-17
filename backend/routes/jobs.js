const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const db = require('../models/database');
const claudeService = require('../services/claudeService');

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

// Function to scrape JavaScript-rendered pages
async function scrapeWithPuppeteer(url) {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set a reasonable timeout and wait for content to load
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait a bit more for dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract text content, focusing on job-related content
    const content = await page.evaluate(() => {
      // Remove unwanted elements
      const unwantedSelectors = ['script', 'style', 'nav', 'footer', 'header', '.nav', '.navbar', '.footer', '.header'];
      unwantedSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      });

      // Try to find job-specific content containers
      const jobSelectors = [
        '.job-description',
        '.job-content',
        '.job-posting',
        '.posting-content',
        '.job-details',
        '#job-description',
        '[class*="job"]',
        '[class*="posting"]',
        '[class*="description"]',
        'main',
        '.content',
        '[role="main"]'
      ];

      for (const selector of jobSelectors) {
        const element = document.querySelector(selector);
        if (element && element.innerText.trim().length > 200) {
          return element.innerText.trim();
        }
      }

      // Fallback to body content
      return document.body.innerText.trim();
    });

    return content;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Get job descriptions - optionally filter by user_id
router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query;

    let query = 'SELECT id, company_name, role_name, source_type, user_id, created FROM job_descriptions';
    let params = [];

    if (user_id) {
      query += ' WHERE user_id = ?';
      params.push(user_id);
    }

    query += ' ORDER BY created DESC';

    const [rows] = await db.execute(query, params);
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

    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);
    const content = pdfData.text;

    // Extract company and role from form data or content
    const companyName = req.body.company || 'Unknown Company';
    const roleName = req.body.role || 'Unknown Role';

    // Insert job description with user_id
    const [jobResult] = await db.execute(
      'INSERT INTO job_descriptions (company_name, role_name, source_type, source_data, original_content, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      [companyName, roleName, 'pdf', req.file.filename, content, user_id]
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
    const { url, company, role, user_id } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Fetch content from URL
    const response = await axios.get(url);
    const content = response.data;

    // Extract meaningful text content using cheerio
    let textContent = '';
    if (typeof content === 'string') {
      const $ = cheerio.load(content);

      // Remove unwanted elements
      $('script, style, nav, footer, header, .nav, .navbar, .footer, .header').remove();

      // Focus on main content areas - prioritize job posting content
      let jobContent = '';

      // Try to find job-specific content containers
      const jobSelectors = [
        '.job-description',
        '.job-content',
        '.job-posting',
        '.posting-content',
        '.job-details',
        '#job-description',
        '[class*="job"]',
        '[class*="posting"]',
        '[class*="description"]',
        'main',
        '.content',
        '[role="main"]'
      ];

      for (const selector of jobSelectors) {
        const element = $(selector);
        if (element.length && element.text().trim().length > 200) {
          jobContent = element.text().trim();
          break;
        }
      }

      // Fallback to body content if no specific job container found
      if (!jobContent) {
        $('body').find('script, style, nav, footer, header').remove();
        jobContent = $('body').text();
      }

      // Clean up whitespace and normalize text
      textContent = jobContent
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();

      // Truncate if too long (Claude has token limits)
      if (textContent.length > 8000) {
        textContent = textContent.substring(0, 8000) + '...';
      }
    } else {
      textContent = JSON.stringify(content, null, 2);
    }

    // Check if we got meaningful content, if not try Puppeteer
    if (!textContent || textContent.trim().length < 50) {
      console.log('Basic scraping failed, trying Puppeteer for JavaScript-rendered content...');
      try {
        textContent = await scrapeWithPuppeteer(url);

        // Clean up whitespace for Puppeteer content too
        textContent = textContent
          .replace(/\s+/g, ' ')
          .replace(/\n\s*\n/g, '\n')
          .trim();

        // Truncate if too long
        if (textContent.length > 8000) {
          textContent = textContent.substring(0, 8000) + '...';
        }

        // Check if Puppeteer was successful
        if (!textContent || textContent.trim().length < 50) {
          return res.status(400).json({
            error: 'Unable to extract meaningful content from URL even with JavaScript rendering. Please try copying and pasting the job description manually.'
          });
        }
      } catch (puppeteerError) {
        console.error('Puppeteer scraping failed:', puppeteerError.message);
        return res.status(400).json({
          error: 'Unable to extract meaningful content from URL. The page may have anti-scraping measures. Please try copying and pasting the job description manually.'
        });
      }
    }

    const companyName = company || 'Unknown Company';
    const roleName = role || 'Unknown Role';

    // Insert job description with user_id
    const [jobResult] = await db.execute(
      'INSERT INTO job_descriptions (company_name, role_name, source_type, source_data, original_content, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      [companyName, roleName, 'url', url, textContent, user_id]
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