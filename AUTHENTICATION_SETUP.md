# Authentication Setup Guide

This guide will help you set up Google OAuth authentication and MongoDB for the chatbot application.

## Prerequisites

1. **MongoDB**: Install and run MongoDB locally or use MongoDB Atlas
2. **Google Cloud Console**: Create a project and enable Google Calendar API
3. **Node.js**: Version 16 or higher

## 1. MongoDB Setup

### Local MongoDB
```bash
# Install MongoDB (Ubuntu/Debian)
sudo apt-get install mongodb

# Start MongoDB service
sudo systemctl start mongodb

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account and cluster
3. Get your connection string

## 2. Google Cloud Console Setup

### Create a Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Calendar API

### Create OAuth 2.0 Credentials
1. Go to "Credentials" in the API & Services section
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Configure the OAuth consent screen first if prompted
4. Choose "Web application"
5. Add authorized redirect URIs:
   - `http://localhost:3001/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)

### OAuth Consent Screen
1. Fill in the required information
2. Add your email to test users
3. Add scopes: `../auth/calendar` and `../auth/userinfo.email`

## 3. Environment Configuration

### Backend Environment (.env)
Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/chatbot-app
SESSION_SECRET=your-super-secret-session-key-here

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# Google Calendar API Configuration
GOOGLE_CALENDAR_ID=primary

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment (.env)
Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:3001/api
```

## 4. Installation

### Backend Dependencies
```bash
cd backend
npm install
```

### Frontend Dependencies
```bash
cd frontend
npm install
```

## 5. Running the Application

### Start MongoDB (if using local)
```bash
# Ubuntu/Debian
sudo systemctl start mongodb

# Or with Docker
docker start mongodb
```

### Start Backend
```bash
cd backend
npm run dev
```

### Start Frontend
```bash
cd frontend
npm run dev
```

## 6. Testing Authentication

1. Open `http://localhost:3000`
2. You should be redirected to the login screen
3. Click "Continue with Google"
4. Complete the OAuth flow
5. You should be redirected back to the chat interface

## 7. Features

### Authentication Features
- ✅ Google OAuth 2.0 login
- ✅ JWT token-based authentication
- ✅ Session management with MongoDB
- ✅ Automatic token refresh
- ✅ Protected routes
- ✅ User profile management

### Calendar Integration
- ✅ Google Calendar API integration
- ✅ Calendar event management
- ✅ User-specific calendar access
- ✅ Secure token storage
- ✅ Calendar connection status

### User Management
- ✅ User profile with Google data
- ✅ Chat session history
- ✅ Calendar preferences
- ✅ Account settings

## 8. Troubleshooting

### Common Issues

#### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Make sure MongoDB is running
```bash
sudo systemctl start mongodb
# or
docker start mongodb
```

#### Google OAuth Error
```
Error: redirect_uri_mismatch
```
**Solution**: Check that the redirect URI in Google Console matches your environment variable

#### JWT Token Error
```
Error: jwt malformed
```
**Solution**: Make sure JWT_SECRET is set in your .env file

#### Calendar API Error
```
Error: Calendar not authenticated
```
**Solution**: Complete the OAuth flow to grant calendar permissions

### Debug Mode
Set `NODE_ENV=development` to see detailed error messages.

## 9. Production Deployment

### Environment Variables
Update your production environment variables:
- Use a secure MongoDB connection string
- Use strong, unique secrets for JWT and sessions
- Update redirect URIs to your production domain
- Set `NODE_ENV=production`

### Security Considerations
- Use HTTPS in production
- Set secure cookie flags
- Implement rate limiting
- Use environment variables for all secrets
- Regularly rotate JWT secrets

## 10. API Endpoints

### Authentication Endpoints
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout user

### Calendar Endpoints
- `GET /api/auth/calendar/status` - Check calendar connection
- `POST /api/auth/calendar/disconnect` - Disconnect calendar

### Chat Endpoints
- `POST /api/webhook` - Send chat message (requires authentication)

## 11. Database Schema

### User Model
```javascript
{
  googleId: String,
  email: String,
  name: String,
  picture: String,
  calendarKeys: {
    accessToken: String,
    refreshToken: String,
    tokenExpiry: Date,
    calendarId: String
  },
  preferences: {
    timezone: String,
    language: String,
    notifications: Object
  },
  chatSessions: [{
    sessionId: String,
    messages: Array,
    createdAt: Date,
    updatedAt: Date
  }],
  isActive: Boolean,
  lastLogin: Date
}
```

## 12. Support

If you encounter any issues:
1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Ensure MongoDB is running and accessible
4. Check Google Cloud Console configuration
5. Review the troubleshooting section above

For additional help, check the application logs in the `backend/logs` directory.
