# Logging System

This application includes a comprehensive logging system that captures all console output and saves it to files for debugging and monitoring purposes.

## Features

- **Automatic Console Capture**: All `console.log`, `console.error`, `console.warn`, `console.info`, and `console.debug` calls are automatically captured and saved to files
- **Separate Log Files**: Different log levels are saved to separate files for better organization
- **Daily Rotation**: Log files are created daily with the format `YYYY-MM-DD-level.log`
- **Automatic Cleanup**: Old log files (older than 7 days) are automatically cleaned up daily
- **Log Statistics**: API endpoints to view log statistics and manage logs
- **Graceful Fallback**: If file writing fails, logs still appear in console

## Log File Structure

Logs are saved in the `backend/logs/` directory with the following naming convention:
- `YYYY-MM-DD-info.log` - General information logs
- `YYYY-MM-DD-error.log` - Error logs
- `YYYY-MM-DD-warn.log` - Warning logs
- `YYYY-MM-DD-debug.log` - Debug logs (only in development mode)

## Log Format

Each log entry follows this format:
```
[2024-01-15T10:30:45.123Z] INFO: Your log message here {"optional": "metadata"}
```

## API Endpoints

### Get Log Statistics
```
GET /api/logs/stats
```

Returns information about log files:
```json
{
  "success": true,
  "data": {
    "totalFiles": 5,
    "totalSize": 1024000,
    "files": [
      {
        "name": "2024-01-15-info.log",
        "size": 204800,
        "modified": "2024-01-15T10:30:45.123Z"
      }
    ]
  }
}
```

### Manual Log Cleanup
```
GET /api/logs/cleanup
```

Manually triggers cleanup of old log files:
```json
{
  "success": true,
  "message": "Log cleanup completed"
}
```

## Usage

The logger is automatically initialized when the application starts. All existing `console.log`, `console.error`, etc. calls will automatically be captured and saved to files.

### Direct Logger Usage

You can also use the logger directly for more structured logging:

```javascript
const logger = require('./utils/logger');

// Basic logging
logger.info('Application started');
logger.error('Something went wrong', { userId: '123', error: 'Database connection failed' });
logger.warn('Deprecated API used');
logger.debug('Debug information', { requestId: 'abc123' });

// Get log statistics
const stats = logger.getLogStats();
console.log('Log statistics:', stats);

// Manual cleanup
logger.cleanupOldLogs();
```

## Configuration

The logging system can be configured through environment variables:

- `NODE_ENV`: Set to 'development' to enable debug logging
- Log directory: `backend/logs/` (automatically created)
- Cleanup interval: 24 hours (automatic)
- Retention period: 7 days

## File Management

- **Automatic Creation**: Log directory and files are created automatically
- **Daily Rotation**: New log files are created each day
- **Size Management**: No automatic size limits (can be added if needed)
- **Cleanup**: Files older than 7 days are automatically deleted

## Troubleshooting

### Logs Not Appearing
1. Check if the `backend/logs/` directory exists and is writable
2. Verify the application has write permissions to the logs directory
3. Check console output for any file writing errors

### Large Log Files
1. Use the cleanup endpoint: `GET /api/logs/cleanup`
2. Check log statistics: `GET /api/logs/stats`
3. Consider implementing log rotation if needed

### Performance Impact
- File writing is synchronous but lightweight
- Log files are appended to, not rewritten
- Automatic cleanup prevents disk space issues
- Console output is preserved alongside file logging

## Development vs Production

- **Development**: Debug logs are enabled and saved to files
- **Production**: Debug logs are disabled but other logs are still captured
- **Console Output**: Always preserved regardless of environment
- **File Logging**: Always enabled regardless of environment
