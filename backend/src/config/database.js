const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      if (this.connection) {
        return this.connection;
      }

      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      };

      this.connection = await mongoose.connect(config.mongodb.uri, options);
      
      logger.info('MongoDB connected successfully', {
        uri: config.mongodb.uri.replace(/\/\/.*@/, '//***:***@'), // Hide credentials in logs
        host: this.connection.connection.host,
        port: this.connection.connection.port,
        name: this.connection.connection.name
      });

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });

      return this.connection;
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        this.connection = null;
        logger.info('MongoDB disconnected successfully');
      }
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  getConnection() {
    return this.connection;
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }

  async healthCheck() {
    try {
      if (!this.isConnected()) {
        throw new Error('Database not connected');
      }
      
      // Simple ping to check connection
      await mongoose.connection.db.admin().ping();
      return {
        status: 'healthy',
        connected: true,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const database = new Database();

module.exports = database;
