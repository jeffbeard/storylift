const fs = require('fs');
const path = require('path');

class RequestLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  generateLogFileName(type = 'requests') {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return path.join(this.logDir, `${type}-${date}.log`);
  }

  formatLogEntry(entry) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${JSON.stringify(entry)}\n`;
  }

  async writeLog(type, entry) {
    try {
      const logFile = this.generateLogFileName(type);
      const logEntry = this.formatLogEntry(entry);
      
      // Use appendFileSync for simplicity, but could be made async
      fs.appendFileSync(logFile, logEntry);
    } catch (error) {
      console.error('[REQUEST LOGGER] Failed to write log:', error.message);
    }
  }

  logOutboundRequest(requestData) {
    const logEntry = {
      type: 'OUTBOUND_REQUEST',
      method: requestData.method || 'GET',
      url: requestData.url,
      userAgent: requestData.userAgent,
      ip: requestData.clientIp,
      userId: requestData.userId,
      endpoint: requestData.endpoint,
      timestamp: new Date().toISOString(),
      requestId: requestData.requestId || this.generateRequestId()
    };

    // Write to file
    this.writeLog('outbound-requests', logEntry);

    // Also log to console for immediate visibility
    console.log(`[OUTBOUND REQUEST] ${requestData.method || 'GET'} ${requestData.url} from ${requestData.clientIp}`);
  }

  logOutboundResponse(responseData) {
    const logEntry = {
      type: 'OUTBOUND_RESPONSE',
      url: responseData.url,
      status: responseData.status,
      statusText: responseData.statusText,
      contentLength: responseData.contentLength,
      responseTime: responseData.responseTime,
      requestId: responseData.requestId,
      timestamp: new Date().toISOString(),
      success: responseData.status >= 200 && responseData.status < 400
    };

    // Write to file
    this.writeLog('outbound-responses', logEntry);

    // Console log for immediate visibility
    const status = responseData.success ? 'SUCCESS' : 'ERROR';
    console.log(`[OUTBOUND RESPONSE] ${status} ${responseData.status} ${responseData.url} (${responseData.responseTime}ms)`);
  }

  logSecurityEvent(eventData) {
    const logEntry = {
      type: 'SECURITY_EVENT',
      event: eventData.event,
      severity: eventData.severity || 'WARNING',
      url: eventData.url,
      ip: eventData.clientIp,
      userId: eventData.userId,
      details: eventData.details,
      timestamp: new Date().toISOString(),
      requestId: eventData.requestId
    };

    // Write to security log
    this.writeLog('security-events', logEntry);

    // Console log for immediate visibility
    console.warn(`[SECURITY EVENT] ${eventData.severity} - ${eventData.event}: ${eventData.details}`);
  }

  logRateLimitHit(rateLimitData) {
    const logEntry = {
      type: 'RATE_LIMIT_HIT',
      ip: rateLimitData.ip,
      endpoint: rateLimitData.endpoint,
      limitType: rateLimitData.limitType,
      currentCount: rateLimitData.currentCount,
      limit: rateLimitData.limit,
      resetTime: rateLimitData.resetTime,
      timestamp: new Date().toISOString()
    };

    // Write to rate limit log
    this.writeLog('rate-limits', logEntry);

    // Console log for immediate visibility
    console.warn(`[RATE LIMIT] Hit for ${rateLimitData.ip} on ${rateLimitData.endpoint} (${rateLimitData.currentCount}/${rateLimitData.limit})`);
  }

  generateRequestId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Method to get recent logs (useful for debugging)
  getRecentLogs(type = 'requests', lines = 50) {
    try {
      const logFile = this.generateLogFileName(type);
      if (!fs.existsSync(logFile)) {
        return [];
      }

      const content = fs.readFileSync(logFile, 'utf8');
      const logLines = content.trim().split('\n').filter(line => line.trim());
      
      return logLines.slice(-lines).map(line => {
        try {
          return JSON.parse(line.substring(line.indexOf('{'))); // Remove timestamp prefix
        } catch (e) {
          return { raw: line };
        }
      });
    } catch (error) {
      console.error('[REQUEST LOGGER] Failed to read logs:', error.message);
      return [];
    }
  }

  // Clean up old log files (keep last 30 days)
  cleanupOldLogs() {
    try {
      const files = fs.readdirSync(this.logDir);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < thirtyDaysAgo) {
          fs.unlinkSync(filePath);
          console.log(`[REQUEST LOGGER] Cleaned up old log file: ${file}`);
        }
      });
    } catch (error) {
      console.error('[REQUEST LOGGER] Failed to cleanup old logs:', error.message);
    }
  }
}

// Create singleton instance
const requestLogger = new RequestLogger();

// Clean up old logs on startup
requestLogger.cleanupOldLogs();

module.exports = requestLogger;
