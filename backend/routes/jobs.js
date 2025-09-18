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
const secureRequester = require('../services/secureRequester');
const requestLogger = require('../services/requestLogger');
const { 
  dbReadLimiter, 
  dbWriteLimiter, 
  uploadLimiter, 
  scrapingLimiter 
} = require('../middleware/rateLimiter');

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

// Function to scrape JavaScript-rendered pages
async function scrapeWithPuppeteer(url, requestContext = {}) {
  let browser = null;
  const startTime = Date.now();
  const requestId = requestLogger.generateRequestId();
  
  try {
    // Validate URL through our security layer first
    const urlValidator = require('../services/urlValidator');
    const validation = await urlValidator.validateURL(url);
    if (!validation.isValid) {
      // Log security event for blocked URL
      requestLogger.logSecurityEvent({
        event: 'PUPPETEER_URL_VALIDATION_FAILED',
        severity: 'WARNING',
        url: url,
        clientIp: requestContext.clientIp,
        userId: requestContext.userId,
        details: validation.errors.join(', '),
        requestId
      });
      
      throw new Error(`URL validation failed: ${validation.errors.join(', ')}`);
    }

    // Log Puppeteer request
    requestLogger.logOutboundRequest({
      method: 'PUPPETEER_GET',
      url: url,
      userAgent: 'Puppeteer/HeadlessChrome',
      clientIp: requestContext.clientIp,
      userId: requestContext.userId,
      endpoint: requestContext.endpoint,
      requestId
    });

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        // Removed --disable-web-security for better security
        '--disable-features=VizDisplayCompositor',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        // Additional security flags
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-pings',
        '--disable-background-networking',
        '--disable-component-extensions-with-background-pages',
        '--disable-ipc-flooding-protection',
        '--disable-hang-monitor',
        '--disable-prompt-on-repost',
        '--disable-domain-reliability',
        '--disable-client-side-phishing-detection',
        '--disable-component-update',
        '--disable-features=TranslateUI,BlinkGenPropertyTrees',
        '--disable-print-preview',
        '--disable-speech-api',
        '--disable-file-system',
        '--disable-permissions-api',
        '--disable-presentation-api',
        '--disable-remote-fonts',
        '--disable-shared-workers',
        '--disable-web-bluetooth',
        '--disable-webgl',
        '--disable-webgl2',
        '--disable-web-security', // Keep this for now but add additional protections
        '--user-data-dir=/tmp/puppeteer-chrome-data',
        '--data-path=/tmp/puppeteer-chrome-data'
      ]
    });
    const page = await browser.newPage();

    // Additional security measures for the page
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0');
    
    // Block unnecessary resources to reduce attack surface
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      // Only allow document, script, and stylesheet requests
      if (['document', 'script', 'stylesheet', 'xhr', 'fetch'].includes(resourceType)) {
        request.continue();
      } else {
        // Block images, fonts, media, etc.
        request.abort();
      }
    });

    // Set additional security headers
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    });

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

    const responseTime = Date.now() - startTime;
    
    // Log successful Puppeteer response
    requestLogger.logOutboundResponse({
      url: url,
      status: 200,
      statusText: 'OK',
      contentLength: content.length,
      responseTime,
      requestId,
      success: true
    });

    return content;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log failed Puppeteer response
    requestLogger.logOutboundResponse({
      url: url,
      status: 0,
      statusText: 'ERROR',
      contentLength: 0,
      responseTime,
      requestId,
      success: false
    });

    // Log security event for failed Puppeteer requests
    requestLogger.logSecurityEvent({
      event: 'PUPPETEER_REQUEST_FAILED',
      severity: 'ERROR',
      url: url,
      clientIp: requestContext.clientIp,
      userId: requestContext.userId,
      details: error.message,
      requestId
    });

    console.error('Puppeteer scraping failed:', error.message);
    throw new Error(`Failed to scrape URL with Puppeteer: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Get job descriptions - optionally filter by user_id
router.get('/', dbReadLimiter, async (req, res) => {
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
router.get('/:id', dbReadLimiter, async (req, res) => {
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
router.post('/upload-pdf', uploadLimiter, upload.single('pdf'), async (req, res) => {
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
router.post('/upload-url', scrapingLimiter, async (req, res) => {
  try {
    const { url, company, role, user_id } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Create request context for logging
    const requestContext = {
      clientIp: req.ip || req.connection.remoteAddress,
      userId: user_id,
      endpoint: '/api/jobs/upload-url'
    };

    // Securely fetch content from URL with validation
    const response = await secureRequester.secureGet(url, requestContext);
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
        textContent = await scrapeWithPuppeteer(url, requestContext);

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
router.delete('/:id', dbWriteLimiter, async (req, res) => {
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