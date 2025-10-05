const axios = require("axios");
const config = require("../config");
const { INTENTS, CONFIDENCE_THRESHOLD } = require("../constants/intents");

class QwenService {
  constructor() {
    this.apiKey = config.qwen.apiKey;
    this.apiUrl = config.qwen.apiUrl;
    this.model = config.qwen.model;

    if (!this.apiKey) {
      throw new Error("QWEN_API_KEY is required");
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
        `${this.apiUrl}/chat/completions`,
        {
          model: this.model,

          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: `Current Date: ${currentDate}${contextText}"${message}"`,
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      const generatedText = response.data.choices[0].message.content;
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
        `${this.apiUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            ...(historyContext
              ? [{ role: "user", content: historyContext }]
              : []),
            {
              role: "user",
              content: message,
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.choices[0].message.content;
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
  - "next week" = current date + 7 days
  - "next month" = current date + 1 month (same day of month)
  - "in two weeks" = current date + 14 days
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
  - "reschedule that event to next month" → {"intent": "update_event", "confidence": 0.95, "fields": {"event_identifier": "that event", "date": "2025-11-02", "time": "15:00"}}
  - "move my meeting to next week" → {"intent": "update_event", "confidence": 0.95, "fields": {"event_identifier": "my meeting", "date": "2025-10-09", "time": "15:00"}}
  - "change the React interview to next month" → {"intent": "update_event", "confidence": 0.95, "fields": {"event_identifier": "React interview", "date": "2025-11-02", "time": "15:00"}}
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
        `${this.apiUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: `${eventsContext}\n\n${historyContext}\n\nUser Query: "${userQuery}"\n`,
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error("Error generating event list response:", error);
      throw new Error("Failed to generate event list response");
    }
  }

  /**
   * Build system prompt for event listing
   */
  buildEventListPrompt() {
    return `
  You are an **AI Event Assistant** that helps users explore and understand their calendar events in a friendly, conversational way.
  
  ---
  
  ### 🎯 Objective
  Interpret the user’s query and provide a **clear, natural-language answer** based on the given calendar data.
  
  ---
  
  ### 🧭 Guidelines
  1. **Understand the User’s Intent**
     - Determine what they are asking about (e.g., events on a certain day, meetings with a person, number of events, etc.).
     - Handle queries like "What do I have tomorrow?", "Do I have a meeting with John?", or "List my upcoming calls".
  
  2. **Use Provided Data**
     - Always base your answer on the given list of calendar events.
     - If there are no matching events, clearly and politely say so.
     - Do **not** invent events or information.
  
  3. **Be Conversational**
     - Respond naturally as a helpful assistant.
     - Avoid robotic lists — use friendly, concise phrasing.
     - Example tone: “You have 3 meetings tomorrow, starting with your team sync at 9 AM.”
  
  4. **Filtering Logic**
     - Filter events by:
       - **Date/time** (e.g., today, tomorrow, this week, next Monday)
       - **Attendees** (names or emails)
       - **Event type** (meeting, call, interview, etc.)
     - If multiple filters are implied, apply them together.
  
  5. **Formatting**
     - List events clearly, including:
       - **Title / summary**
       - **Date and time** (formatted readably, e.g., “Oct 6 at 2:00 PM”)
       - **Optional:** attendees or location when relevant
     - Use bullet points or numbered lists if multiple events.
  
  6. **If No Matches**
     - Say so politely and suggest an alternative, e.g.:
       - “I don’t see any meetings with John this week.”
       - “You don’t have any events tomorrow.”
  
  7. **Style**
     - Be concise but informative.
     - Avoid repeating user input verbatim.
     - No JSON — output should be **natural text only**.
  
  ---
  
  ### 💬 Example Responses
  
  **User:** “What meetings do I have tomorrow?”  
  **Assistant:** “You have 3 meetings tomorrow:  
  - Team Standup at 9:00 AM  
  - Client Review at 11:30 AM  
  - Product Sync at 3:00 PM.”
  
  ---
  
  **User:** “Any meetings with John?”  
  **Assistant:** “I don’t see any meetings with John this week.”
  
  ---
  
  **User:** “List my upcoming events.”  
  **Assistant:** “Here are your next 3 events:  
  1. Project Kickoff – Today at 2:00 PM  
  2. Design Review – Tomorrow at 10:00 AM  
  3. Client Call – Friday at 4:00 PM.”
  
  ---
  
  **User:** “Do I have anything scheduled on Sunday?”  
  **Assistant:** “No, your calendar is clear on Sunday.”
  
  ---
  
  ### ⚙️ Notes
  - Never include code or JSON in responses.  
  - Prioritize correctness and clarity over verbosity.  
  - If the user’s question is ambiguous, briefly clarify before listing events.
  
  `;
  }

  /**
   * Build events context for Qwen
   */
  buildEventsContext(calendarEvents) {
    if (!calendarEvents || calendarEvents.length === 0) {
      return "Calendar Events: No events found in the calendar.";
    }

    const eventsText = calendarEvents
      .map((event) => {
        const startTime = new Date(event.start.dateTime || event.start.date);
        const endTime = new Date(event.end.dateTime || event.end.date);
        const dateStr = startTime.toDateString();
        const timeStr = startTime.toLocaleTimeString();
        const endTimeStr = endTime.toLocaleTimeString();
        const attendees =
          event.attendees?.map((a) => a.email).join(", ") || "None";
        const location = event.location || "No location";

        return `ID: ${event.id}
Title: ${event.summary}
Date: ${dateStr}
Time: ${timeStr} - ${endTimeStr}
Location: ${location}
Attendees: ${attendees}
Description: ${event.description || "No description"}`;
      })
      .join("\n\n");

    return `Calendar Events:\n${eventsText}\n\nToday's Date: ${new Date().toDateString()}`;
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
        `${this.apiUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: `${eventsContext}\n\n${historyContext}\n\nUser Query: "${userQuery}"`,
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      const generatedText = response.data.choices[0].message.content;
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
    return `
  You are an **Event Search Intelligence Assistant**.  
  Your job is to identify the **most likely matching event** from a user's calendar based on a natural language query.
  
  ---
  
  ### 🎯 Objective
  - Interpret the user's message to determine **which event** they are referring to.
  - Use semantic reasoning to match **titles, dates, attendees, locations**, and **contextual references** (like “that meeting”, “tomorrow’s call”, etc.).
  - Select the **single best candidate** event, or **return null** if no confident match exists.
  
  ---
  
  ### 🧭 Guidelines for Matching
  1. **Contextual Understanding**
     - Use conversation history to resolve references like “that meeting” or “the one with John”.
     - Consider recency and temporal expressions (e.g., “tomorrow”, “next week”, “yesterday”).
  
  2. **Matching Heuristics**
     - Compare query terms against:
       - Event **title** (partial or fuzzy match)
       - Event **attendees** (names, emails)
       - Event **date/time** (absolute or relative)
       - Event **location** (if mentioned)
       - Event **type keywords** (meeting, call, interview, etc.)
  
  3. **Confidence Scoring**
     - Assign a value between **0.0–1.0** estimating how confident you are in the match.
     - 1.0 = exact match across multiple dimensions (title/date/attendees)
     - 0.5 = plausible match (title or attendee match but unclear date)
     - <0.3 = likely no valid match → return null
  
  4. **Behavior**
     - Return the **complete event object** with all known fields (especially **id**).
     - If multiple events are equally likely, choose the **most recent upcoming** one.
     - If no good match is found → set \`"success": false\` and \`"event": null\`.
  
  ---
  
  ### 🧾 Output Format (Strict JSON)
  Always return a **valid JSON object** in the following format:
  
  \`\`\`json
  {
    "success": true,
    "event": {
      "id": "event_id_here",
      "summary": "event_title",
      "start": {"dateTime": "2025-10-05T14:00:00Z"},
      "end": {"dateTime": "2025-10-05T15:00:00Z"},
      "attendees": [{"email": "user@example.com", "displayName": "John Doe"}],
      "location": "Meeting Room A",
      "description": "Discuss project updates"
    },
    "confidence": 0.92,
    "message": "Matched based on title and attendee similarity."
  }
  \`\`\`
  
  If no confident match is found:
  \`\`\`json
  {
    "success": false,
    "event": null,
    "confidence": 0.0,
    "message": "No event closely matches the query."
  }
  \`\`\`
  
  ---
  
  ### 💡 Examples
  
  **Input:** "React interview"  
  → Match an event with “React” in title or description.
  
  **Output:**
  \`\`\`json
  {
    "success": true,
    "event": {
      "id": "evt_432",
      "summary": "React Developer Interview",
      "start": {"dateTime": "2025-10-07T09:00:00Z"},
      "end": {"dateTime": "2025-10-07T10:00:00Z"},
      "attendees": [{"email": "hr@company.com", "displayName": "HR"}],
      "location": "Google Meet",
      "description": "Interview with frontend candidate"
    },
    "confidence": 0.93,
    "message": "Matched exact title 'React Developer Interview'."
  }
  \`\`\`
  
  **Input:** "that meeting"  
  → Use prior context from conversation to infer referenced event.
  
  **Input:** "tomorrow’s call"  
  → Find event scheduled for tomorrow containing “call” or similar keywords.
  
  **Input:** "meeting with John"  
  → Match event where attendee includes “John”.
  
  ---
  
  ### ⚠️ Notes
  - Output **must be pure JSON**, with **no extra text or explanations** outside the object.  
  - Never invent fields that aren’t part of the real event data structure.  
  - Prioritize accuracy, clarity, and reliability of the \`confidence\` score.  
  - If multiple events are found, choose **the one most contextually relevant**.
  
  `;
  }

  /**
   * Parse event search response from Qwen
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
   * Parse Qwen's response to extract intent data
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

module.exports = new QwenService();
