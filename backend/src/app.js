const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createServer } = require('http');
const { Server } = require('socket.io');
const config = require('./config');
const database = require('./config/database');
const webhookRoutes = require('./routes/webhook');
const authRoutes = require('./routes/auth');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const intentProcessor = require('./services/intentProcessor');
const logger = require('./utils/logger');

// Create Express app
const app = express();
const server = createServer(app);

// Initialize Socket.IO for real-time communication
const io = new Server(server, {
  cors: {
    origin: config.cors.origin,
    methods: ['GET', 'POST']
  }
});

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors(config.cors));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', webhookRoutes);
app.use('/api/auth', authRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Chatbot API Server',
    version: '1.0.0',
    endpoints: {
      webhook: '/api/webhook',
      health: '/api/health',
      googleAuth: '/api/auth/google',
      logs: '/api/logs'
    }
  });
});

// Log management endpoints
app.get('/api/logs/stats', (req, res) => {
  try {
    const stats = logger.getLogStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get log statistics'
    });
  }
});

app.get('/api/logs/cleanup', (req, res) => {
  try {
    logger.cleanupOldLogs();
    res.json({
      success: true,
      message: 'Log cleanup completed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup logs'
    });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle real-time chat messages
  socket.on('chat_message', async (data) => {
    try {
      const { text, userId } = data;
      
      if (!text || !userId) {
        socket.emit('error', { message: 'Invalid message format' });
        return;
      }

      // Process message through intent pipeline
      const result = await intentProcessor.processMessage(text, userId, null);
      
      // Update user session
      if (result.success) {
        intentProcessor.updateUserSession(userId, text, result.response);
      }

      // Send response back to client
      socket.emit('chat_response', result);
    } catch (error) {
      console.error('Socket error:', error);
      socket.emit('error', { message: 'Failed to process message' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Cleanup old user sessions every hour
setInterval(() => {
  intentProcessor.cleanupOldSessions();
}, 60 * 60 * 1000);

// Cleanup old log files daily
setInterval(() => {
  logger.cleanupOldLogs();
}, 24 * 60 * 60 * 1000);

// Start server
const PORT = config.port;

// Initialize database and start server
async function startServer() {
  try {
    // Connect to MongoDB
    await database.connect();
    
    server.listen(PORT, () => {
      console.log(`🚀 Chatbot API server running on port ${PORT}`);
      console.log(`📱 Frontend URL: ${config.cors.origin}`);
      console.log(`🔗 Webhook endpoint: http://localhost:${PORT}/api/webhook`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
      console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
      console.log(`📝 Logs endpoint: http://localhost:${PORT}/api/logs/stats`);
      console.log(`🗂️  Log files saved to: ${logger.logDir}`);
      console.log(`🗄️  MongoDB connected: ${database.isConnected()}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await database.disconnect();
    console.log('Process terminated');
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(async () => {
    await database.disconnect();
    console.log('Process terminated');
  });
});

module.exports = { app, server, io };

