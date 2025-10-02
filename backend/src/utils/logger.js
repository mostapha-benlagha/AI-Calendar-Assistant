const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDirectory();
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug
    };
    this.overrideConsole();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  getLogFilePath(level = 'general') {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${date}-${level}.log`);
  }

  writeToFile(level, message, meta = {}) {
    try {
      const formattedMessage = this.formatMessage(level, message, meta);
      const logFile = this.getLogFilePath(level);
      fs.appendFileSync(logFile, formattedMessage + '\n');
    } catch (error) {
      // Fallback to original console if file writing fails
      this.originalConsole.error('Failed to write to log file:', error);
    }
  }

  log(level, message, meta = {}) {
    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Console output
    this.originalConsole[level] || this.originalConsole.log(formattedMessage);
    
    // File output
    this.writeToFile(level, message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, meta);
    }
  }

  // Override console methods to capture all console output
  overrideConsole() {
    const self = this;
    
    console.log = (...args) => {
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (error) {
            // Handle circular references
            return '[Circular Reference]';
          }
        }
        return String(arg);
      }).join(' ');
      self.originalConsole.log(...args);
      self.writeToFile('info', message);
    };

    console.error = (...args) => {
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (error) {
            // Handle circular references
            return '[Circular Reference]';
          }
        }
        return String(arg);
      }).join(' ');
      self.originalConsole.error(...args);
      self.writeToFile('error', message);
    };

    console.warn = (...args) => {
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (error) {
            // Handle circular references
            return '[Circular Reference]';
          }
        }
        return String(arg);
      }).join(' ');
      self.originalConsole.warn(...args);
      self.writeToFile('warn', message);
    };

    console.info = (...args) => {
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (error) {
            // Handle circular references
            return '[Circular Reference]';
          }
        }
        return String(arg);
      }).join(' ');
      self.originalConsole.info(...args);
      self.writeToFile('info', message);
    };

    console.debug = (...args) => {
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (error) {
            // Handle circular references
            return '[Circular Reference]';
          }
        }
        return String(arg);
      }).join(' ');
      self.originalConsole.debug(...args);
      if (process.env.NODE_ENV === 'development') {
        self.writeToFile('debug', message);
      }
    };
  }

  // Method to restore original console (useful for testing)
  restoreConsole() {
    console.log = this.originalConsole.log;
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.info = this.originalConsole.info;
    console.debug = this.originalConsole.debug;
  }

  // Clean up old log files (keep only last 7 days)
  cleanupOldLogs() {
    try {
      const files = fs.readdirSync(this.logDir);
      const now = Date.now();
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

      files.forEach(file => {
        if (file.endsWith('.log')) {
          const filePath = path.join(this.logDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime.getTime() < sevenDaysAgo) {
            fs.unlinkSync(filePath);
            this.originalConsole.log(`Cleaned up old log file: ${file}`);
          }
        }
      });
    } catch (error) {
      this.originalConsole.error('Error cleaning up old logs:', error);
    }
  }

  // Get log statistics
  getLogStats() {
    try {
      const files = fs.readdirSync(this.logDir);
      const stats = {
        totalFiles: 0,
        totalSize: 0,
        files: []
      };

      files.forEach(file => {
        if (file.endsWith('.log')) {
          const filePath = path.join(this.logDir, file);
          const fileStats = fs.statSync(filePath);
          stats.totalFiles++;
          stats.totalSize += fileStats.size;
          stats.files.push({
            name: file,
            size: fileStats.size,
            modified: fileStats.mtime
          });
        }
      });

      return stats;
    } catch (error) {
      this.originalConsole.error('Error getting log stats:', error);
      return null;
    }
  }
}

module.exports = new Logger();