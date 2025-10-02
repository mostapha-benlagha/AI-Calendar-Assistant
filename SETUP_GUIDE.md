# AI Calendar Assistant - Setup Guide

Complete step-by-step guide to get the AI Calendar Assistant up and running.

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Google Cloud Console account** - [Sign up](https://console.cloud.google.com/)
- **Google AI Studio account** - [Sign up](https://makersuite.google.com/)

## Step 1: Google Cloud Setup (Google Calendar API)

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "AI Calendar Assistant")
5. Click "Create"

### 1.2 Enable Google Calendar API

1. In your project, go to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

### 1.3 Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: "AI Calendar Assistant"
   - User support email: Your email
   - Developer contact: Your email
   - Click "Save and Continue" through all steps
4. Back in "Create OAuth client ID":
   - Application type: "Web application"
   - Name: "AI Calendar Assistant"
   - Authorized redirect URIs: Add `http://localhost:3001/auth/google/callback`
   - Click "Create"
5. **Important:** Copy the Client ID and Client Secret (you'll need these later)

## Step 2: Google AI Studio Setup (Gemini API)

### 2.1 Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Select your Google Cloud project
4. Copy the generated API key (you'll need this later)

## Step 3: Backend Setup

### 3.1 Navigate to Backend Directory

```bash
cd chatbot-app/backend
```

### 3.2 Install Dependencies

```bash
npm install
```

### 3.3 Create Environment File

Create a `.env` file in the `backend` directory:

```bash
# On Windows (PowerShell)
New-Item -Path .env -ItemType File

# On macOS/Linux
touch .env
```

### 3.4 Configure Environment Variables

Open `.env` and add the following (replace with your actual values):

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent

# Google Calendar API Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback
GOOGLE_CALENDAR_ID=primary

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Important:** Replace the following placeholders:
- `your_gemini_api_key_here` → Your Gemini API key from Step 2
- `your_google_client_id_here` → Your Google OAuth Client ID from Step 1
- `your_google_client_secret_here` → Your Google OAuth Client Secret from Step 1

### 3.5 Start Backend Server

```bash
npm run dev
```

You should see:
```
🚀 Chatbot API server running on port 3001
📱 Frontend URL: http://localhost:3000
🔗 Webhook endpoint: http://localhost:3001/api/webhook
❤️  Health check: http://localhost:3001/api/health
```

## Step 4: Frontend Setup

### 4.1 Open New Terminal

Keep the backend terminal running and open a new terminal window.

### 4.2 Navigate to Frontend Directory

```bash
cd chatbot-app/frontend
```

### 4.3 Install Dependencies

```bash
npm install
```

### 4.4 Start Frontend Development Server

```bash
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

## Step 5: Access the Application

1. Open your web browser
2. Navigate to `http://localhost:3000`
3. You should see the AI Calendar Assistant interface

## Step 6: Connect Google Calendar

### 6.1 Get Authorization URL

1. In your browser, open a new tab
2. Navigate to: `http://localhost:3001/api/auth/google`
3. Copy the `authUrl` from the JSON response

### 6.2 Authorize the Application

1. Paste the `authUrl` in your browser
2. Sign in with your Google account
3. Grant the requested permissions
4. You'll be redirected back with authorization tokens

**Note:** In a production application, this would be integrated into the UI with a "Connect Calendar" button.

## Step 7: Test the Application

### 7.1 Test General Chat

Try these messages:
- "What's the weather like today?"
- "Tell me a joke"
- "How can I improve my productivity?"

### 7.2 Test Calendar Intents

Try these messages (without connecting calendar, you'll see the intent extraction):
- "Schedule a meeting with John tomorrow at 2 PM"
- "Cancel my 3 PM appointment"
- "What's on my calendar for next week?"

## Troubleshooting

### Backend Won't Start

**Error:** `GEMINI_API_KEY is required`
- **Solution:** Check your `.env` file has the correct Gemini API key

**Error:** `Port 3001 is already in use`
- **Solution:** Kill the process using port 3001 or change the PORT in `.env`

### Frontend Won't Connect

**Error:** Connection failed
- **Solution:** Ensure backend is running on port 3001
- **Solution:** Check CORS settings in backend `.env`

### Calendar API Errors

**Error:** `Failed to create calendar event`
- **Solution:** Ensure you've completed the OAuth flow
- **Solution:** Check that Google Calendar API is enabled
- **Solution:** Verify OAuth credentials are correct

### Gemini API Errors

**Error:** `Failed to extract intent`
- **Solution:** Check your Gemini API key is valid
- **Solution:** Ensure you have API quota remaining
- **Solution:** Verify the API URL is correct

## Testing Messages

Use the test messages from `backend/test-messages.json` to verify functionality:

### Create Event
```
"Schedule a meeting with John tomorrow at 2 PM"
"Book a client call for next Friday at 10 AM in the conference room"
```

### Update Event
```
"Reschedule my 3 PM appointment to 4 PM"
"Move my team meeting from Tuesday to Wednesday"
```

### Cancel Event
```
"Cancel my dentist appointment"
"Remove the Friday team standup"
```

### Prepare Event
```
"Prepare for my client meeting next week"
"Give me details about tomorrow's presentation"
```

### Follow-up Event
```
"Schedule a follow-up meeting 3 days after my client call"
"Set up a check-in 1 week after the project kickoff"
```

## Next Steps

1. **Implement OAuth Flow in UI** - Add a "Connect Calendar" button in the frontend
2. **Store Tokens Securely** - Implement a database to store user OAuth tokens
3. **Add User Authentication** - Implement user accounts and authentication
4. **Deploy to Production** - Use services like Vercel (frontend) and Heroku (backend)
5. **Extend Functionality** - Add more intent types and features

## Production Deployment Checklist

- [ ] Set `NODE_ENV=production` in backend
- [ ] Use secure session storage
- [ ] Implement proper token refresh logic
- [ ] Add comprehensive error logging
- [ ] Set up monitoring and alerts
- [ ] Configure SSL/HTTPS
- [ ] Update OAuth redirect URIs
- [ ] Implement rate limiting
- [ ] Add input sanitization
- [ ] Set up automated backups
- [ ] Configure CDN for frontend assets

## Support

If you encounter issues:
1. Check the console logs (browser and backend terminal)
2. Verify all environment variables are set correctly
3. Ensure all required APIs are enabled in Google Cloud Console
4. Check that API keys have not expired or exceeded quotas

## Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Socket.IO Documentation](https://socket.io/docs/v4/)

---

**Happy Coding! 🚀**

