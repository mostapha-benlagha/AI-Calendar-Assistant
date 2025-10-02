const axios = require("axios");
const config = require("../config");
const { INTENTS, CONFIDENCE_THRESHOLD } = require("../constants/intents");

class GeminiService {
  constructor() {
    this.apiKey = config.gemini.apiKey;
    this.apiUrl = config.gemini.apiUrl;

    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is required");
    }
  }

  /**
   * Extract intent and fields from user message with conversation context
   * @param {string} message - User's message
   * @param {Array} conversationHistory - Previous conversation messages
   * @returns {Promise<Object>} - { intent, confidence, fields }
   */
  async extractIntent(message, conversationHistory = []) {
    try {
      const systemPrompt = this.buildIntentExtractionPrompt();
      const currentDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

      // Build context from conversation history
      let contextText = "";
      if (conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-6); // Last 6 messages for context
        contextText = "\n\nConversation Context:\n";
        recentHistory.forEach((msg) => {
          const role = msg.role === "user" ? "User" : "Assistant";
          contextText += `${role}: ${msg.content}\n`;
        });
        contextText += "\nCurrent message: ";
      }

      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\nCurrent Date: ${currentDate}${contextText}"${message}"`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.0,
            topK: 1,
            topP: 0.8,
            maxOutputTokens: 1024,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const generatedText = response.data.candidates[0].content.parts[0].text;
      const result = this.parseIntentResponse(generatedText);
      result.originalMessage = message;
      return result;
    } catch (error) {
      console.error("Error extracting intent:", error);
      throw new Error("Failed to extract intent from message");
    }
  }

  /**
   * Generate general chat response
   * @param {string} message - User's message
   * @param {Array} conversationHistory - Previous messages for context
   * @returns {Promise<string>} - AI response
   */
  async generateChatResponse(message, conversationHistory = []) {
    try {
      const systemPrompt = this.buildChatPrompt();
      const historyContext = this.buildHistoryContext(conversationHistory);

      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\n${historyContext}\n\nUser: "${message}"\n\nAssistant:`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("Error generating chat response:", error);
      throw new Error("Failed to generate chat response");
    }
  }

  /**
   * Build system prompt for intent extraction
   */
  buildIntentExtractionPrompt() {
    const validIntents = Object.values(INTENTS).join(", ");

    return `You are an intent extraction assistant for a real estate productivity platform. 
  Extract the intent and fields from user messages about calendar and scheduling tasks.
  
  Return JSON only in this exact format: { "intent": "intent_name", "confidence": 0.95, "fields": {...} }
  
  Valid intents: ${validIntents}
  
  Fields may include:
  - title: Event title/subject
  - date: Date in YYYY-MM-DD format (calculate relative dates like "tomorrow" = today + 1 day, "three days from now" = today + 3 days)
  - time: Time in HH:MM format (24-hour)
  - end: End time in HH:MM format
  - duration: Duration in minutes or hours
  - location: Event location
  - attendees: Array of attendee names or emails (extract names, not emails unless explicitly provided)
  - description: Event description
  - followupDays: Number of days for follow-up
  - event_identifier: Title, date, or description to identify existing event
  - userMessage: Original user query (for info requests)
  
  IMPORTANT: For date calculations, use the current date as your reference point. Calculate relative dates:
  - "today" = current date
  - "tomorrow" = current date + 1 day
  - "three days from now" = current date + 3 days
  - "next Monday" = next occurrence of Monday
  - Always return dates in YYYY-MM-DD format
  
  ### Rules:
  1. If the user explicitly wants to schedule, update, cancel, prepare, or follow up on an event → use the matching intent.
  2. For cancel/delete/remove operations, use **cancel_event** intent:
     - "cancel", "delete", "remove" + event identifier
     - Examples: "cancel my meeting", "delete the interview", "remove that event"
  3. If the user asks about their calendar, agenda, events, schedule, meetings, or appointments 
     **but it doesn't match another intent** → use **list_events**.
     (Examples: "what's on my schedule?", "do I have meetings tomorrow?", 
     "show me my appointments with John", "what events are planned?")
  4. If the user asks something not related to events or calendar → use 
     get_information, help_request, or general_chat as appropriate.
  5. Always use conversation context for "that event", "this meeting", etc.
  
  ### Examples (assuming current date is 2025-10-02):
  - "Schedule a meeting with John tomorrow at 2 PM" → {"intent": "create_event", "confidence": 0.95, "fields": {"title": "Meeting with John", "date": "2025-10-03", "time": "14:00", "attendees": ["John"]}}
  - "Create an event three days from now at 4 PM with Islam" → {"intent": "create_event", "confidence": 0.95, "fields": {"title": "Meeting with Islam", "date": "2025-10-05", "time": "16:00", "attendees": ["Islam"]}}
  - "Cancel my 3 PM appointment" → {"intent": "cancel_event", "confidence": 0.9, "fields": {"event_identifier": "3 PM appointment"}}
  - "Delete the React interview" → {"intent": "cancel_event", "confidence": 0.95, "fields": {"event_identifier": "React interview"}}
  - "Remove my meeting tomorrow" → {"intent": "cancel_event", "confidence": 0.9, "fields": {"event_identifier": "meeting tomorrow"}}
  - "Cancel that event" → {"intent": "cancel_event", "confidence": 0.9, "fields": {"event_identifier": "that event"}}
  - "What events do I have?" → {"intent": "list_events", "confidence": 0.95, "fields": {"userMessage": "what events do i have"}}
  - "Do I have any meetings with John tomorrow?" → {"intent": "list_events", "confidence": 0.95, "fields": {"date": "2025-10-03", "attendees": ["John"]}}
  - "update that event title to be meeting with Nadhir" → {"intent": "update_event", "confidence": 0.95, "fields": {"event_identifier": "test", "title": "meeting with nadhir"}}
  - "What can you help me with?" → {"intent": "get_information", "confidence": 0.9, "fields": {}}
  - "Help me with something" → {"intent": "help_request", "confidence": 0.9, "fields": {}}
  - "What's the weather like?" → {"intent": "general_chat", "confidence": 0.8, "fields": {}}`;
  }

  /**
   * Generate contextual response for event listing
   * @param {string} userQuery - User's original query
   * @param {Array} calendarEvents - List of calendar events
   * @param {Array} conversationHistory - Previous conversation messages
   * @returns {Promise<string>} - Generated response
   */
  async generateEventListResponse(
    userQuery,
    calendarEvents,
    conversationHistory
  ) {
    try {
      const systemPrompt = this.buildEventListPrompt();
      const eventsContext = this.buildEventsContext(calendarEvents);
      const historyContext = this.buildHistoryContext(conversationHistory);

      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\n${eventsContext}\n\n${historyContext}\n\nUser Query: "${userQuery}"\n\nAssistant:`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("Error generating event list response:", error);
      throw new Error("Failed to generate event list response");
    }
  }

  /**
   * Build system prompt for event listing
   */
  buildEventListPrompt() {
    return `You are a helpful calendar assistant. Based on the user's query and their calendar events, provide a natural, contextual response.

Guidelines:
- Analyze the user's query to understand what they're looking for
- Use the provided calendar events to answer their question
- Be conversational and helpful
- If they ask about specific dates, attendees, or types of events, filter accordingly
- If no events match their criteria, explain that clearly
- Format events in a readable way with dates and times
- Be concise but informative

Examples of good responses:
- "You have 3 meetings tomorrow: [list them]"
- "I don't see any meetings with John this week"
- "Here are your upcoming events: [list them]"
- "You have a busy day tomorrow with 4 meetings starting at 9 AM"`;
  }

  /**
   * Build events context for Gemini
   */
  buildEventsContext(calendarEvents) {
    if (!calendarEvents || calendarEvents.length === 0) {
      return "Calendar Events: No events found in the calendar.";
    }

    const eventsText = calendarEvents
      .map((event) => {
        const startTime = new Date(event.start.dateTime || event.start.date);
        const endTime = new Date(event.end.dateTime || event.end.date);
        const dateStr = startTime.toLocaleDateString();
        const timeStr = startTime.toLocaleTimeString();
        const endTimeStr = endTime.toLocaleTimeString();
        const attendees = event.attendees?.map(a => a.email).join(', ') || 'None';
        const location = event.location || 'No location';

        return `ID: ${event.id}
Title: ${event.summary}
Date: ${dateStr}
Time: ${timeStr} - ${endTimeStr}
Location: ${location}
Attendees: ${attendees}
Description: ${event.description || 'No description'}`;
      })
      .join("\n\n");

    return `Calendar Events:\n${eventsText}`;
  }

  /**
   * Use AI to find the best matching event based on user query
   * @param {string} userQuery - User's event identifier query
   * @param {Array} calendarEvents - All calendar events
   * @param {Array} conversationHistory - Previous conversation messages
   * @returns {Promise<Object>} - { success: boolean, event: Object|null, confidence: number, message: string }
   */
  async findMatchingEvent(userQuery, calendarEvents, conversationHistory = []) {
    try {
      const systemPrompt = this.buildEventSearchPrompt();
      const eventsContext = this.buildEventsContext(calendarEvents);
      const historyContext = this.buildHistoryContext(conversationHistory);

      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\n${eventsContext}\n\n${historyContext}\n\nUser Query: "${userQuery}"\n\nAssistant:`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 512,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const generatedText = response.data.candidates[0].content.parts[0].text;
      return this.parseEventSearchResponse(generatedText, calendarEvents);
    } catch (error) {
      console.error("Error finding matching event:", error);
      throw new Error("Failed to find matching event");
    }
  }

  /**
   * Build system prompt for event search
   */
  buildEventSearchPrompt() {
    return `You are an intelligent event search assistant. Your job is to find the best matching event from the user's calendar based on their query.

Guidelines:
- Analyze the user's query to understand what event they're referring to
- Consider partial matches, similar titles, dates, attendees, and context
- Use conversation history to understand references like "that event", "this meeting", etc.
- Return the most likely matching event with its ID
- If no good match is found, return null

Return your response in this exact JSON format:
{
  "success": true/false,
  "event": {"id": "event_id_here", "summary": "event_title", "start": {...}, "end": {...}, "attendees": [...], "location": "...", "description": "..."},
  "confidence": 0.0-1.0,
  "message": "explanation of your choice"
}

IMPORTANT: When you find a matching event, return the complete event object with all its properties including the ID. The ID is crucial for the system to identify the correct event.

Examples:
- User: "React interview" → Find event with "React" in title, return full event object
- User: "that meeting" → Use conversation context to find recent event, return full event object
- User: "tomorrow's call" → Find event scheduled for tomorrow, return full event object
- User: "meeting with John" → Find event with John as attendee, return full event object

Be smart about matching - consider:
- Partial title matches
- Date references (today, tomorrow, specific dates)
- Attendee names
- Event types (meeting, call, interview, etc.)
- Recent conversation context`;
  }

  /**
   * Parse event search response from Gemini
   */
  parseEventSearchResponse(generatedText, calendarEvents) {
    try {
      // Extract JSON from response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          success: false,
          event: null,
          confidence: 0,
          message: "Could not parse AI response",
        };
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate structure
      if (
        typeof parsed.success !== "boolean" ||
        typeof parsed.confidence !== "number"
      ) {
        return {
          success: false,
          event: null,
          confidence: 0,
          message: "Invalid AI response format",
        };
      }

      // If AI found an event, validate it exists in our calendar
      if (parsed.success && parsed.event) {
        const foundEvent = calendarEvents.find(
          (event) => event.id === parsed.event.id
        );
        if (!foundEvent) {
          return {
            success: false,
            event: null,
            confidence: 0,
            message: "AI suggested event not found in calendar",
          };
        }
        parsed.event = foundEvent; // Use the actual event object
      }

      return parsed;
    } catch (error) {
      console.error("Error parsing event search response:", error);
      return {
        success: false,
        event: null,
        confidence: 0,
        message: "Failed to parse AI response",
      };
    }
  }

  /**
   * Build system prompt for general chat
   */
  buildChatPrompt() {
    return `You are a helpful AI assistant for a real estate productivity platform. 
You help users with general questions, provide information, and assist with various tasks.
Be friendly, professional, and concise in your responses.
If users ask about calendar or scheduling, guide them to use specific commands.`;
  }

  /**
   * Build conversation history context
   */
  buildHistoryContext(conversationHistory) {
    if (!conversationHistory || conversationHistory.length === 0) {
      return "";
    }

    const recentHistory = conversationHistory.slice(-6); // Last 6 messages
    return recentHistory
      .map(
        (msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
      )
      .join("\n");
  }

  /**
   * Parse Gemini's response to extract intent data
   */
  parseIntentResponse(responseText) {
    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Check if this is a multiple intent response
      if (parsed.multipleIntents && Array.isArray(parsed.multipleIntents)) {
        return parsed;
      }

      // Validate single intent structure
      if (
        !parsed.intent ||
        typeof parsed.confidence !== "number" ||
        !parsed.fields
      ) {
        throw new Error("Invalid response structure");
      }

      // Ensure confidence is between 0 and 1
      parsed.confidence = Math.max(0, Math.min(1, parsed.confidence));

      // If confidence is below threshold, default to general_chat
      if (parsed.confidence < CONFIDENCE_THRESHOLD) {
        return {
          intent: INTENTS.GENERAL_CHAT,
          confidence: 0.5,
          fields: {},
        };
      }

      return parsed;
    } catch (error) {
      console.error("Error parsing intent response:", error);
      // Fallback to general chat
      return {
        intent: INTENTS.GENERAL_CHAT,
        confidence: 0.5,
        fields: {},
      };
    }
  }
}

module.exports = new GeminiService();
