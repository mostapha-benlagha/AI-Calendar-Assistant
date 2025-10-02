# AI Calendar Assistant

A full-stack chatbot application that integrates with Google Calendar and performs intelligent actions based on user intents. Built with Express.js, React, and Google's Gemini AI.

## Features

### 🎯 Intent-Based Processing
- **Agenda & Scheduling Intents**: create_event, update_event, cancel_event, prepare_event, followup_event
- **AI-Powered Intent Extraction**: Uses Gemini AI to understand user messages
- **Smart Validation**: Asks for missing information and resolves ambiguities
- **Fallback to General Chat**: When no specific intent is detected

### 📅 Calendar Integration
- **Google Calendar API**: Full CRUD operations for calendar events
- **Event Management**: Create, update, cancel, and prepare for events
- **Follow-up Scheduling**: Automatically schedule follow-up meetings
- **Event Search**: Find events by title, date, or description

### 💬 Real-time Chat Interface
- **WebSocket Communication**: Real-time message exchange
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Event Cards**: Rich display of calendar events and actions
- **Connection Status**: Visual indicators for connection state

## Tech Stack

### Backend
- **Node.js** with Express.js
- **Google Calendar API** for calendar operations
- **Google Gemini AI** for intent extraction and chat
- **Socket.IO** for real-time communication
- **Joi** for request validation

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Socket.IO Client** for real-time communication
- **Lucide React** for icons

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Google Cloud Console project with Calendar API enabled
- Google Gemini API key

### 1. Clone and Setup

```bash
git clone <repository-url>
cd chatbot-app
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

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

Start the backend server:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Start the frontend development server:

```bash
npm run dev
```

### 4. Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Calendar API
4. Create OAuth 2.0 credentials
5. Add `http://localhost:3001/auth/google/callback` to authorized redirect URIs
6. Copy the Client ID and Client Secret to your `.env` file

### 5. Gemini API Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key to your `.env` file

## Usage Examples

### Calendar Operations

**Create Event:**
```
"Schedule a meeting with John tomorrow at 2 PM"
"Book a client call for next Friday at 10 AM in the conference room"
```

**Update Event:**
```
"Reschedule my 3 PM appointment to 4 PM"
"Move my team meeting from Tuesday to Wednesday"
```

**Cancel Event:**
```
"Cancel my dentist appointment"
"Remove the Friday team standup"
```

**Prepare for Event:**
```
"Prepare for my client meeting next week"
"Give me details about tomorrow's presentation"
```

**Follow-up Event:**
```
"Schedule a follow-up meeting 3 days after my client call"
"Set up a check-in 1 week after the project kickoff"
```

### General Chat
```
"What's the weather like today?"
"Tell me about real estate market trends"
"How can I improve my productivity?"
```

## API Endpoints

### Webhook Endpoint
```
POST /api/webhook
Content-Type: application/json

{
  "text": "Schedule a meeting tomorrow at 2 PM",
  "userId": "user123"
}
```

### Health Check
```
GET /api/health
```

### Google OAuth
```
GET /api/auth/google
GET /api/auth/google/callback
```

## Project Structure

```
chatbot-app/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── constants/       # Intent definitions
│   │   ├── controllers/     # Request handlers
│   │   ├── middlewares/     # Express middlewares
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── app.js          # Main application
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── types/          # TypeScript types
│   │   ├── App.tsx         # Main app component
│   │   └── main.tsx        # Entry point
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Development

### Backend Development
```bash
cd backend
npm run dev  # Starts with nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Starts Vite dev server
```

### Building for Production
```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

## Environment Variables

### Required Variables
- `GEMINI_API_KEY`: Your Google Gemini API key
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret

### Optional Variables
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `FRONTEND_URL`: Frontend URL for CORS
- `GOOGLE_CALENDAR_ID`: Calendar ID (default: 'primary')

## Error Handling

The application includes comprehensive error handling:

- **Validation Errors**: Invalid request format
- **API Errors**: Gemini or Google Calendar API failures
- **Connection Errors**: WebSocket disconnections
- **Rate Limiting**: Too many requests protection

## Security Features

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Joi schema validation
- **CORS Protection**: Configurable cross-origin requests
- **Helmet**: Security headers
- **Environment Variables**: Sensitive data protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

## Roadmap

- [ ] Add more intent types (document management, performance tracking)
- [ ] Implement user authentication
- [ ] Add calendar event templates
- [ ] Support for multiple calendars
- [ ] Mobile app development
- [ ] Advanced AI features (sentiment analysis, smart scheduling)

