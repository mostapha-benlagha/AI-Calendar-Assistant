const intentProcessor = require('../services/intentProcessor');
const { authenticateToken, optionalAuth } = require('../middlewares/auth');
const Joi = require('joi');

// Validation schema for webhook requests
const webhookSchema = Joi.object({
  text: Joi.string().required().min(1).max(1000),
  userId: Joi.string().optional().min(1).max(100) // Optional since we can get from auth
});

/**
 * Handle webhook requests for chatbot processing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleWebhook = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = webhookSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request format',
        details: error.details[0].message
      });
    }

    const { text, userId } = value;
    
    // Use authenticated user ID if available, otherwise use provided userId
    const effectiveUserId = req.user?._id || userId;
    
    if (!effectiveUserId) {
      return res.status(400).json({
        success: false,
        error: 'User identification required'
      });
    }

    // Process the message through the intent pipeline
    const result = await intentProcessor.processMessage(text, effectiveUserId, req.user);

    // Update user session with the conversation
    if (result.success && req.user) {
      // Add message to user's chat session if authenticated
      try {
        await req.user.addMessageToSession(
          req.user.getActiveSession()?.sessionId || 'default',
          'user',
          text
        );
        await req.user.addMessageToSession(
          req.user.getActiveSession()?.sessionId || 'default',
          'assistant',
          result.response
        );
      } catch (sessionError) {
        console.error('Error updating user session:', sessionError);
        // Don't fail the request if session update fails
      }
    } else if (result.success) {
      // Fallback to old session management for non-authenticated users
      intentProcessor.updateUserSession(effectiveUserId, text, result.response);
    }

    // Return the result
    res.json(result);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing your request.'
    });
  }
};

/**
 * Handle Google OAuth callback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleGoogleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code not provided'
      });
    }

    // Exchange code for tokens
    const calendarService = require('../services/calendarService');
    const tokens = await calendarService.getTokens(code);
    
    // In a real application, you would store these tokens securely
    // associated with the user ID from the state parameter
    console.log('OAuth tokens received:', tokens);
    
    // Send success message to parent window if opened as popup
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Calendar Linked Successfully</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              background: rgba(255, 255, 255, 0.1);
              padding: 2rem;
              border-radius: 1rem;
              backdrop-filter: blur(10px);
            }
            .success-icon {
              font-size: 3rem;
              margin-bottom: 1rem;
            }
            h1 {
              margin: 0 0 1rem 0;
              font-size: 1.5rem;
            }
            p {
              margin: 0;
              opacity: 0.9;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✅</div>
            <h1>Calendar Linked Successfully!</h1>
            <p>You can now close this window and start using the calendar features.</p>
          </div>
          <script>
            // Notify parent window of success
            if (window.opener) {
              window.opener.postMessage({
                type: 'GOOGLE_AUTH_SUCCESS',
                success: true
              }, '*');
            }
            
            // Auto-close after 3 seconds
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </body>
      </html>
    `;
    
    res.send(htmlResponse);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete Google OAuth flow'
    });
  }
};

/**
 * Get Google OAuth authorization URL
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getGoogleAuthUrl = async (req, res) => {
  try {
    const calendarService = require('../services/calendarService');
    const authUrl = calendarService.getAuthUrl();
    
    res.json({
      success: true,
      authUrl: authUrl
    });
  } catch (error) {
    console.error('Error getting Google auth URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate Google OAuth URL'
    });
  }
};

/**
 * Health check endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const healthCheck = (req, res) => {
  res.json({
    success: true,
    message: 'Chatbot API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
};

module.exports = {
  handleWebhook,
  handleGoogleCallback,
  getGoogleAuthUrl,
  healthCheck
};

