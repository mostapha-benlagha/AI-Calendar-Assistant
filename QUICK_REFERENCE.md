# Quick Reference Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Chat UI     │  │ Event Cards  │  │ WebSocket    │      │
│  └─────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    WebSocket/HTTP
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      Backend (Express)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Webhook      │  │ Intent       │  │ Session      │      │
│  │ Controller   │  │ Processor    │  │ Manager      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ Gemini       │  │ Calendar     │                        │
│  │ Service      │  │ Service      │                        │
│  └──────────────┘  └──────────────┘                        │
└──────────────────────────┬──┬──────────────────────────────┘
                           │  │
                    ┌──────┘  └──────┐
                    │                │
           ┌────────▼────────┐  ┌────▼──────────┐
           │ Gemini API      │  │ Google        │
           │ (Intent + Chat) │  │ Calendar API  │
           └─────────────────┘  └───────────────┘
```

## Processing Pipeline

```
User Message
    ↓
1. Input Validation
    ↓
2. NLP Extraction (Gemini)
    ↓
3. Intent Recognition
    ↓
4. Field Validation
    ↓
5. Resolution (if needed)
    ↓
6. Action Execution
    ↓
7. Response Generation
    ↓
User Feedback
```

## Key Components

### Backend

| Component | Purpose | Location |
|-----------|---------|----------|
| `app.js` | Main application setup | `src/app.js` |
| `geminiService.js` | Intent extraction & chat | `src/services/geminiService.js` |
| `calendarService.js` | Calendar operations | `src/services/calendarService.js` |
| `intentProcessor.js` | Intent processing pipeline | `src/services/intentProcessor.js` |
| `webhookController.js` | Request handling | `src/controllers/webhookController.js` |

### Frontend

| Component | Purpose | Location |
|-----------|---------|----------|
| `App.tsx` | Main app component | `src/App.tsx` |
| `useChat.ts` | Chat logic hook | `src/hooks/useChat.ts` |
| `ChatContainer.tsx` | Message display | `src/components/ChatContainer.tsx` |
| `EventCard.tsx` | Event details | `src/components/EventCard.tsx` |
| `ChatInput.tsx` | Message input | `src/components/ChatInput.tsx` |

## Supported Intents

### Agenda & Scheduling (Implemented)

| Intent | Description | Required Fields | Example |
|--------|-------------|----------------|---------|
| `create_event` | Create new calendar event | title, date, time | "Schedule meeting tomorrow at 2 PM" |
| `update_event` | Modify existing event | event_identifier | "Reschedule my 3 PM meeting to 4 PM" |
| `cancel_event` | Delete calendar event | event_identifier | "Cancel my dentist appointment" |
| `prepare_event` | Get event details + AI notes | event_identifier | "Prepare for my client meeting" |
| `followup_event` | Create follow-up meeting | event_identifier, followupDays | "Schedule follow-up 3 days after" |
| `general_chat` | Conversational fallback | none | "What's the weather today?" |

## API Endpoints

### POST `/api/webhook`
Process chat messages

**Request:**
```json
{
  "text": "Schedule a meeting tomorrow at 2 PM",
  "userId": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "intent": "create_event",
  "confidence": 0.95,
  "response": "Event created successfully",
  "data": {
    "action": "create_event",
    "event": { /* event details */ }
  }
}
```

### GET `/api/health`
Health check

**Response:**
```json
{
  "success": true,
  "message": "Chatbot API is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

### GET `/api/auth/google`
Get Google OAuth URL

### GET `/api/auth/google/callback`
OAuth callback handler

## WebSocket Events

### Client → Server

| Event | Data | Purpose |
|-------|------|---------|
| `chat_message` | `{ text, userId }` | Send message |

### Server → Client

| Event | Data | Purpose |
|-------|------|---------|
| `chat_response` | `{ success, response, data }` | Message response |
| `error` | `{ message }` | Error notification |

## Configuration

### Backend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3001 | Server port |
| `NODE_ENV` | No | development | Environment |
| `GEMINI_API_KEY` | Yes | - | Gemini API key |
| `GOOGLE_CLIENT_ID` | Yes | - | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | - | OAuth secret |
| `FRONTEND_URL` | No | http://localhost:3000 | Frontend URL |
| `GOOGLE_CALENDAR_ID` | No | primary | Calendar ID |

### Gemini Configuration

| Setting | Intent Extraction | General Chat |
|---------|------------------|--------------|
| Temperature | 0.0 | 0.7 |
| Top K | 1 | 40 |
| Top P | 0.8 | 0.95 |
| Max Tokens | 1024 | 1024 |

## Common Commands

### Backend
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start

# Run tests
npm test
```

### Frontend
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Debugging Tips

### Check Backend Logs
```bash
# View logs in terminal or
cat logs/2024-01-15.log
```

### Test Webhook Directly
```bash
curl -X POST http://localhost:3001/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"text":"Schedule a meeting tomorrow at 2 PM","userId":"test123"}'
```

### Check WebSocket Connection
```javascript
// In browser console
const socket = io('http://localhost:3001');
socket.on('connect', () => console.log('Connected'));
socket.emit('chat_message', { text: 'Hello', userId: 'test' });
```

## Performance Tips

1. **Rate Limiting**: Adjust `RATE_LIMIT_MAX_REQUESTS` based on usage
2. **Session Cleanup**: Runs every hour, adjust in `intentProcessor.js`
3. **Message History**: Limited to 20 messages per user
4. **Connection Timeout**: 20 seconds for WebSocket

## Security Best Practices

1. Never commit `.env` files
2. Use HTTPS in production
3. Implement proper user authentication
4. Validate all user inputs
5. Rate limit API requests
6. Sanitize HTML in messages
7. Use secure session storage
8. Implement CSRF protection
9. Regular security audits
10. Keep dependencies updated

## Extension Points

### Add New Intent

1. Add intent to `src/constants/intents.js`
2. Define required fields in `REQUIRED_FIELDS`
3. Implement action in `intentProcessor.js`
4. Update Gemini prompt in `geminiService.js`
5. Test with example messages

### Add New Service

1. Create service file in `src/services/`
2. Export singleton instance
3. Import in controller or processor
4. Add error handling
5. Update documentation

## Useful Links

- **Project Repo**: [Your GitHub URL]
- **Gemini Docs**: https://ai.google.dev/docs
- **Calendar API**: https://developers.google.com/calendar
- **React Docs**: https://react.dev/
- **Express Docs**: https://expressjs.com/

## Quick Start Commands

```bash
# Terminal 1 - Backend
cd chatbot-app/backend
npm install
cp env.example .env
# Edit .env with your API keys
npm run dev

# Terminal 2 - Frontend
cd chatbot-app/frontend
npm install
npm run dev

# Browser
open http://localhost:3000
```

## Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful request |
| 201 | Created | Event created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing auth |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Error | Server error |

## Version Info

- **Backend**: Express 4.18+, Node 18+
- **Frontend**: React 18, Vite 5
- **APIs**: Gemini Pro, Google Calendar v3
- **Real-time**: Socket.IO 4.7+

---

**Last Updated**: October 2025

