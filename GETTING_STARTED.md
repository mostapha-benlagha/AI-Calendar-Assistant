# Getting Started with AI Calendar Assistant

Welcome! This guide will help you get the AI Calendar Assistant up and running in under 15 minutes.

## 📋 What You'll Need

Before starting, gather these:
- ✅ Google account
- ✅ 15 minutes of time
- ✅ Node.js installed (v18+)
- ✅ Basic terminal/command line knowledge

## 🚀 Quick Start (5 Steps)

### Step 1: Get API Keys (5 minutes)

#### Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key → Save it somewhere safe

#### Google Calendar Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable "Google Calendar API"
4. Create OAuth credentials:
   - Go to Credentials → Create Credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URI: `http://localhost:3001/auth/google/callback`
5. Copy Client ID and Client Secret → Save them

### Step 2: Setup Backend (3 minutes)

```bash
# Navigate to backend
cd chatbot-app/backend

# Install dependencies
npm install

# Create .env file
cp env.example .env

# Edit .env with your API keys
# Replace the following:
# - GEMINI_API_KEY=your_gemini_api_key_here
# - GOOGLE_CLIENT_ID=your_google_client_id_here
# - GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### Step 3: Setup Frontend (2 minutes)

```bash
# Open a new terminal window
# Navigate to frontend
cd chatbot-app/frontend

# Install dependencies
npm install
```

### Step 4: Start the Application (1 minute)

**Terminal 1 (Backend):**
```bash
cd chatbot-app/backend
npm run dev
```

You should see:
```
🚀 Chatbot API server running on port 3001
```

**Terminal 2 (Frontend):**
```bash
cd chatbot-app/frontend
npm run dev
```

You should see:
```
➜  Local:   http://localhost:3000/
```

### Step 5: Open and Test (1 minute)

1. Open your browser
2. Go to `http://localhost:3000`
3. Try typing: **"Schedule a meeting tomorrow at 2 PM"**
4. Watch the magic happen! ✨

## 🎯 What to Try Next

### Basic Messages
```
"Schedule a meeting with John tomorrow at 2 PM"
"Reschedule my 3 PM appointment to 4 PM"
"Cancel my dentist appointment"
"What's the weather like today?"
```

### Advanced Features
```
"Prepare for my client meeting next week"
"Schedule a follow-up 3 days after my project kickoff"
"Book a property viewing for next Tuesday at 2 PM in downtown"
```

## 🔍 Verify Everything Works

### Check Backend
```bash
curl http://localhost:3001/api/health
```

Should return:
```json
{
  "success": true,
  "message": "Chatbot API is running"
}
```

### Check Frontend
Open browser developer console (F12) and look for:
```
Connected to server
```

## ❓ Troubleshooting

### "Cannot find module" error
**Solution:** Run `npm install` in the affected directory

### "Port already in use"
**Solution:** 
```bash
# Kill the process or change port in .env
# For Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# For Mac/Linux:
lsof -ti:3001 | xargs kill -9
```

### "GEMINI_API_KEY is required"
**Solution:** Check your `.env` file has all required keys set correctly

### "Failed to connect"
**Solution:** 
1. Ensure backend is running on port 3001
2. Check browser console for errors
3. Verify CORS settings in backend `.env`

### "Intent extraction failed"
**Solution:** 
1. Verify Gemini API key is valid
2. Check you have API quota remaining
3. Look at backend console for detailed errors

## 📚 Next Steps

Now that you're up and running:

1. **Read the Documentation**
   - `README.md` - Project overview
   - `SETUP_GUIDE.md` - Detailed setup
   - `QUICK_REFERENCE.md` - API reference
   - `PROJECT_SUMMARY.md` - Architecture details

2. **Connect Your Calendar**
   - Visit: `http://localhost:3001/api/auth/google`
   - Copy the `authUrl`
   - Paste in browser and authorize

3. **Explore Features**
   - Try all test messages from `backend/test-messages.json`
   - Create events with different parameters
   - Test error handling with invalid inputs

4. **Customize**
   - Modify UI colors in `frontend/tailwind.config.js`
   - Add new intents in `backend/src/constants/intents.js`
   - Adjust Gemini prompts in `backend/src/services/geminiService.js`

## 🎨 UI Features

### Chat Interface
- **User messages**: Blue bubbles on the right
- **AI responses**: White bubbles on the left
- **Event cards**: Rich display with icons and details
- **Connection status**: Green/red indicator in header

### Example Event Card
When you create an event, you'll see:
- ✅ Action completed icon
- 📅 Event date and time
- 📍 Location (if provided)
- 👥 Attendees (if provided)
- 📝 AI-generated notes (for prepare_event)

## 🔐 Security Notes

- Never commit your `.env` file
- Keep API keys secret
- Use HTTPS in production
- Implement user authentication before deployment
- Review security best practices in documentation

## 💡 Tips & Tricks

### Natural Language
The system understands:
- **Relative dates**: "tomorrow", "next Friday", "in 3 days"
- **Times**: "2 PM", "14:00", "half past 2"
- **Durations**: "for 1 hour", "30 minutes"

### Efficient Usage
- Be specific with event identifiers for updates/cancellations
- Include all details in one message when possible
- Use natural language - no need for rigid formats

### Best Practices
- Always check the confidence score in logs
- Review events before confirming in production
- Keep conversation context by staying in same session

## 📊 What's Happening Behind the Scenes

When you type a message:

1. **Frontend** → Sends to backend via WebSocket
2. **Backend** → Calls Gemini AI for intent extraction
3. **Gemini** → Analyzes text and returns JSON
4. **Backend** → Validates and processes intent
5. **Calendar API** → Performs action (if calendar intent)
6. **Backend** → Generates user-friendly response
7. **Frontend** → Displays message or event card

All of this happens in ~1-2 seconds!

## 🌟 Cool Features to Explore

1. **Real-time Communication**
   - Messages appear instantly
   - No page refresh needed
   - Connection status updates live

2. **Smart Intent Recognition**
   - Handles typos and variations
   - Extracts multiple fields at once
   - Asks for missing information

3. **Context Awareness**
   - Remembers conversation history
   - Handles follow-up questions
   - Maintains user sessions

4. **Fallback Handling**
   - Unknown intents → general chat
   - Missing fields → asks user
   - Multiple matches → disambiguation

## 🎓 Learning Resources

### Video Tutorials (Recommended)
Search YouTube for:
- "Express.js REST API tutorial"
- "React with TypeScript tutorial"
- "Socket.IO real-time apps"
- "Google Calendar API integration"

### Documentation
- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Google Calendar API](https://developers.google.com/calendar)

## 🤝 Getting Help

### Built-in Help
Type in the chat:
```
"help"
"how do I schedule a meeting?"
"what can you do?"
```

### Check Logs
**Backend logs:**
```bash
# In backend terminal, you'll see:
[timestamp] INFO: Processing message...
[timestamp] INFO: Intent extracted: create_event
```

**Frontend console:**
```bash
# Press F12 in browser
Console tab shows:
Connected to server
Message sent: {...}
Response received: {...}
```

### Common Issues Reference
See `TROUBLESHOOTING.md` for detailed solutions (if exists) or check the main README.

## 📈 Performance

Expected performance:
- **Message processing**: < 2 seconds
- **Intent extraction**: ~1 second
- **Calendar operations**: ~1 second
- **UI updates**: < 100ms

## 🎉 Success Checklist

You're all set if you can:
- ✅ Start backend without errors
- ✅ Start frontend without errors
- ✅ See the chat interface at localhost:3000
- ✅ Send a message and get a response
- ✅ See "Connected" status in header
- ✅ Intent is correctly identified

## 🚦 What's Next?

### For Learning
- Explore the codebase
- Modify the UI styling
- Add a new intent type
- Integrate another API

### For Production
- Set up a database
- Implement user authentication
- Deploy to cloud (Vercel + Heroku)
- Add monitoring and analytics

### For Enhancement
- Add voice input
- Support recurring events
- Implement calendar sharing
- Create mobile app

---

**Congratulations! You're now ready to use the AI Calendar Assistant! 🎊**

Need help? Check the other documentation files or open an issue.

**Happy Scheduling! 📅✨**

