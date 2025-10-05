const {
  INTENTS,
  REQUIRED_FIELDS,
  OPTIONAL_FIELDS,
} = require("../constants/intents");
const calendarService = require("./calendarService");
const qwenService = require("./qwenService");

class IntentProcessor {
  constructor() {
    this.userSessions = new Map(); // Store user session data
  }

  /**
   * Process user message through the complete pipeline
   * @param {string} text - User message
   * @param {string} userId - User identifier
   * @param {Object} user - User object (optional, for authenticated users)
   * @returns {Promise<Object>} - Processing result
   */
  async processMessage(text, userId, user = null) {
    try {
      // Step 1: Get conversation history for context
      const userSession = this.getUserSession(userId);
      const conversationHistory = userSession.conversationHistory || [];

      // Step 2: Check for multiple intents (chaining)
      const multipleIntents = await this.detectMultipleIntents(
        text,
        conversationHistory
      );

      if (multipleIntents.length > 1) {
        return await this.executeMultipleIntents(
          multipleIntents,
          userId,
          text,
          user
        );
      }

      // Step 3: Single intent processing (existing logic)
      const extractionResult = await qwenService.extractIntent(
        text,
        conversationHistory
      );

      // Step 4: Resolution & Validation
      const validationResult = await this.validateAndResolve(
        extractionResult,
        userId,
        user
      );

      // Step 5: Action/Workflow Execution
      const actionResult = await this.executeAction(
        validationResult,
        userId,
        user
      );

      // Step 6: Feedback Generation
      const feedback = await this.generateFeedback(
        actionResult,
        validationResult
      );

      // Step 7: Update conversation history
      this.updateUserSession(userId, text, feedback);

      return {
        success: true,
        intent: validationResult.intent,
        confidence: validationResult.confidence,
        response: feedback,
        data: actionResult.data || null,
      };
    } catch (error) {
      console.error("Error processing message:", error);
      return {
        success: false,
        error: error.message,
        response:
          "I apologize, but I encountered an error processing your request. Please try again.",
      };
    }
  }

  /**
   * Detect multiple intents in a single message
   * @param {string} text - User message
   * @param {Array} conversationHistory - Previous conversation messages
   * @returns {Promise<Array>} - Array of detected intents
   */
  async detectMultipleIntents(text, conversationHistory) {
    try {
      const systemPrompt = this.buildMultipleIntentPrompt();
      const historyContext = this.buildHistoryContext(conversationHistory);

      const response = await qwenService.extractIntent(
        `${systemPrompt}\n\n${historyContext}\n\nUser Message: "${text}"`,
        conversationHistory
      );

      // Parse the response to extract multiple intents
      return this.parseMultipleIntents(response);
    } catch (error) {
      console.error("Error detecting multiple intents:", error);
      return []; // Fall back to single intent processing
    }
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
      .map((msg) => {
        const role = msg.role === "user" ? "User" : "Assistant";
        return `${role}: ${msg.content}`;
      })
      .join("\n");
  }

  /**
   * Build prompt for detecting multiple intents
   */
  buildMultipleIntentPrompt() {
    return `
  You are an **Intent Detection Assistant** designed to analyze user messages and determine if they contain **multiple separate intents or actions**.
  
  ### Your Objective
  Determine whether the user's input contains more than one independent action (intent).  
  Each intent represents an action that can be executed on its own.
  
  ---
  
  ### Guidelines for Detection
  - Look for connectors indicating separate actions:
    - Examples: "and", "then", "after that", "next", "also", "as well", "followed by"
  - Each **distinct action** should correspond to one **intent** with its own fields or parameters.
  - If the actions depend on one another but are still separable, treat them as multiple intents.
  - If the message describes one continuous or single action, it's a single intent.
  
  ---
  
  ### Return Format (Strict JSON)
  Always return **only** valid JSON in this exact format:
  
  \`\`\`json
  {
    "multipleIntents": [
      {
        "intent": "string (the detected intent name, e.g., 'create_event', 'cancel_event')",
        "fields": { "fieldName": "value", ... }
      }
    ]
  }
  \`\`\`
  
  - If **multiple intents** are found → include one object per intent.
  - If **only one intent** or **none** is found → return:
  \`\`\`json
  { "multipleIntents": [] }
  \`\`\`
  
  ---
  
  ### Examples
  **Input:** "Duplicate this event and cancel the other one"  
  **Output:**  
  \`\`\`json
  {
    "multipleIntents": [
      { "intent": "duplicate_event", "fields": { "target": "this event" } },
      { "intent": "cancel_event", "fields": { "target": "other one" } }
    ]
  }
  \`\`\`
  
  **Input:** "List my events and update their titles"  
  **Output:**  
  \`\`\`json
  {
    "multipleIntents": [
      { "intent": "list_events", "fields": {} },
      { "intent": "update_event_titles", "fields": {} }
    ]
  }
  \`\`\`
  
  **Input:** "Create an event tomorrow"  
  **Output:**  
  \`\`\`json
  { "multipleIntents": [] }
  \`\`\`
  
  **Input:** "Cancel my meeting"  
  **Output:**  
  \`\`\`json
  { "multipleIntents": [] }
  \`\`\`
  
  ---
  
  ### Notes
  - Be concise and deterministic — no explanations, reasoning, or text outside JSON.
  - Output **must** be parseable JSON.
  - If uncertain, err on the side of returning a single intent.
  
  `;
  }

  /**
   * Parse multiple intents from response
   */
  parseMultipleIntents(response) {
    try {
      if (response.multipleIntents && Array.isArray(response.multipleIntents)) {
        return response.multipleIntents;
      }
      return [];
    } catch (error) {
      console.error("Error parsing multiple intents:", error);
      return [];
    }
  }

  /**
   * Execute multiple intents sequentially
   * @param {Array} intents - Array of intent objects
   * @param {string} userId - User identifier
   * @param {string} originalText - Original user message
   * @returns {Promise<Object>} - Combined result
   */
  async executeMultipleIntents(intents, userId, originalText, user = null) {
    try {
      const results = [];
      let allSuccessful = true;
      let combinedMessage = "I've executed the following actions:\n\n";

      for (let i = 0; i < intents.length; i++) {
        const intent = intents[i];

        try {
          // Validate and resolve each intent
          const validationResult = await this.validateAndResolve(
            intent,
            userId,
            user
          );

          if (validationResult.needsClarification) {
            results.push({
              success: false,
              intent: intent.intent,
              message: validationResult.clarificationMessage,
            });
            allSuccessful = false;
            combinedMessage += `${i + 1}. ❌ ${intent.intent}: ${
              validationResult.clarificationMessage
            }\n`;
            continue;
          }

          // Execute the action
          const actionResult = await this.executeAction(
            validationResult,
            userId
          );

          if (actionResult.success) {
            results.push({
              success: true,
              intent: intent.intent,
              message: actionResult.message,
              data: actionResult.data,
            });
            combinedMessage += `${i + 1}. ✅ ${intent.intent}: ${
              actionResult.message
            }\n`;
          } else {
            results.push({
              success: false,
              intent: intent.intent,
              message: actionResult.error || "Action failed",
            });
            allSuccessful = false;
            combinedMessage += `${i + 1}. ❌ ${intent.intent}: ${
              actionResult.error || "Action failed"
            }\n`;
          }
        } catch (error) {
          results.push({
            success: false,
            intent: intent.intent,
            message: error.message,
          });
          allSuccessful = false;
          combinedMessage += `${i + 1}. ❌ ${intent.intent}: ${
            error.message
          }\n`;
        }
      }

      // Update conversation history
      this.updateUserSession(userId, originalText, combinedMessage);

      return {
        success: allSuccessful,
        intent: "multiple_intents",
        confidence: 0.9,
        response: combinedMessage,
        data: {
          action: "multiple_intents",
          results: results,
          totalIntents: intents.length,
          successfulIntents: results.filter((r) => r.success).length,
        },
      };
    } catch (error) {
      console.error("Error executing multiple intents:", error);
      return {
        success: false,
        intent: "multiple_intents",
        confidence: 0.0,
        response:
          "I encountered an error while processing multiple actions. Please try again.",
        error: error.message,
      };
    }
  }

  /**
   * Validate and resolve intent with missing fields
   * @param {Object} extractionResult - Intent extraction result
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} - Validated and resolved intent
   */
  async validateAndResolve(extractionResult, userId, user = null) {
    const { intent, confidence, fields, originalMessage } = extractionResult;

    // Check if this is a general chat request
    if (intent === INTENTS.GENERAL_CHAT) {
      return {
        intent,
        confidence,
        fields: {},
        requiresAction: false,
        originalMessage,
      };
    }

    // Get user session for context
    const userSession = this.getUserSession(userId);

    // Check required fields
    const requiredFields = REQUIRED_FIELDS[intent] || [];
    const missingFields = requiredFields.filter((field) => !fields[field]);

    if (missingFields.length > 0) {
      // Store partial intent in session for later completion
      userSession.pendingIntent = {
        intent,
        fields,
        missingFields,
        timestamp: Date.now(),
      };

      return {
        intent,
        confidence,
        fields,
        missingFields,
        requiresAction: false,
        needsClarification: true,
        clarificationMessage: this.generateClarificationMessage(
          intent,
          missingFields,
          fields
        ),
      };
    }

    // Handle event resolution for update/cancel operations
    if (
      [
        INTENTS.UPDATE_EVENT,
        INTENTS.CANCEL_EVENT,
        INTENTS.PREPARE_EVENT,
        INTENTS.FOLLOWUP_EVENT,
      ].includes(intent)
    ) {
      const resolutionResult = await this.resolveEventIdentifier(
        fields.event_identifier,
        userId,
        user
      );

      if (!resolutionResult.success) {
        return {
          intent,
          confidence,
          fields,
          requiresAction: false,
          needsClarification: true,
          clarificationMessage: resolutionResult.message,
        };
      }

      // Add resolved event data to fields
      fields.resolvedEvent = resolutionResult.event;
      if (resolutionResult.multipleMatches) {
        fields.multipleMatches = resolutionResult.events;
      }
    }

    return {
      intent,
      confidence,
      fields,
      requiresAction: true,
    };
  }

  /**
   * Execute the appropriate action based on intent
   * @param {Object} validationResult - Validated intent result
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} - Action execution result
   */
  async executeAction(validationResult, userId, user = null) {
    const { intent, fields, requiresAction } = validationResult;

    if (!requiresAction) {
      if (validationResult.needsClarification) {
        return {
          success: true,
          type: "clarification",
          message: validationResult.clarificationMessage,
        };
      }

      // Handle general chat
      if (intent === INTENTS.GENERAL_CHAT) {
        return await this.executeGeneralChat({
          ...fields,
          userMessage: validationResult.originalMessage || "",
        });
      }
    }

    // Execute calendar actions
    switch (intent) {
      case INTENTS.CREATE_EVENT:
        return await this.executeCreateEvent(fields, user);

      case INTENTS.UPDATE_EVENT:
        return await this.executeUpdateEvent(fields, user);

      case INTENTS.CANCEL_EVENT:
        return await this.executeCancelEvent(fields, user);

      case INTENTS.PREPARE_EVENT:
        return await this.executePrepareEvent(fields, user);

      case INTENTS.FOLLOWUP_EVENT:
        return await this.executeFollowupEvent(fields, user);

      case INTENTS.LIST_EVENTS:
        return await this.executeListEvents(fields, userId, user);

      case INTENTS.GET_INFORMATION:
        return await this.executeGetInformation(fields);

      case INTENTS.HELP_REQUEST:
        return await this.executeHelpRequest(fields);

      case INTENTS.GENERAL_CHAT:
        return await this.executeGeneralChat(fields);

      default:
        throw new Error(`Unsupported intent: ${intent}`);
    }
  }

  /**
   * Generate feedback response for the user
   * @param {Object} actionResult - Action execution result
   * @param {Object} validationResult - Validation result
   * @returns {Promise<string>} - Feedback message
   */
  async generateFeedback(actionResult, validationResult) {
    if (actionResult.type === "clarification") {
      return actionResult.message;
    }

    if (actionResult.type === "chat") {
      return actionResult.message;
    }

    if (actionResult.success) {
      return actionResult.message || "Action completed successfully.";
    } else {
      return actionResult.error || "Action failed. Please try again.";
    }
  }

  /**
   * Execute create event action
   */
  async executeCreateEvent(fields, user = null) {
    try {
      const result = await calendarService.createEvent(fields, user);
      return {
        success: true,
        type: "calendar_action",
        message: result.message,
        data: {
          action: "create_event",
          event: result.event,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Execute update event action
   */
  async executeUpdateEvent(fields, user = null) {
    try {
      const { resolvedEvent, ...updateData } = fields;
      const result = await calendarService.updateEvent(
        resolvedEvent.id,
        updateData,
        user
      );

      return {
        success: true,
        type: "calendar_action",
        message: result.message,
        data: {
          action: "update_event",
          event: result.event,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Execute cancel event action
   */
  async executeCancelEvent(fields, user = null) {
    try {
      const { resolvedEvent } = fields;
      const result = await calendarService.cancelEvent(resolvedEvent.id, user);

      return {
        success: true,
        type: "calendar_action",
        message: result.message,
        data: {
          action: "cancel_event",
          eventId: resolvedEvent.id,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Execute prepare event action
   */
  async executePrepareEvent(fields, user = null) {
    try {
      const { resolvedEvent } = fields;
      const result = await calendarService.getEvent(resolvedEvent.id, user);

      // Generate AI notes for the event
      const notes = await this.generateEventNotes(result.event);

      return {
        success: true,
        type: "calendar_action",
        message: `Here are the details and notes for your event:`,
        data: {
          action: "prepare_event",
          event: result.event,
          notes: notes,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Execute follow-up event action
   */
  async executeFollowupEvent(fields, user = null) {
    try {
      const { resolvedEvent, followupDays, ...customData } = fields;
      const result = await calendarService.createFollowupEvent(
        resolvedEvent.id,
        followupDays,
        customData,
        user
      );

      return {
        success: true,
        type: "calendar_action",
        message: result.message,
        data: {
          action: "followup_event",
          event: result.event,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Execute list events action
   * @param {Object} fields - Extracted fields
   * @returns {Promise<Object>} - Action result
   */
  async executeListEvents(fields, userId, user = null) {
    try {
      const { userMessage } = fields;

      // Get all calendar events for context
      const calendarResult = await calendarService.searchEvents("", user);
      const calendarEvents = calendarResult.events || [];

      // Get conversation history for context
      const userSession = this.getUserSession(userId);
      const conversationHistory = userSession.conversationHistory || [];

      // Use Gemini to generate a contextual response based on the user's query and available events
      const response = await qwenService.generateEventListResponse(
        userMessage || "Show me my events",
        calendarEvents,
        conversationHistory
      );

      return {
        success: true,
        type: "calendar_info",
        message: response,
        data: {
          events: calendarEvents,
          totalCount: calendarEvents.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Resolve event identifier to actual event
   */
  async resolveEventIdentifier(identifier, userId, user = null) {
    try {
      // Get all calendar events for AI search
      const calendarResult = await calendarService.searchEvents("", user);
      const calendarEvents = calendarResult.events || [];

      if (calendarEvents.length === 0) {
        return {
          success: false,
          message: "No events found in your calendar.",
        };
      }

      // Get conversation history for context
      const userSession = this.getUserSession(userId);
      const conversationHistory = userSession.conversationHistory || [];

      // Use AI to find the best matching event
      const aiResult = await qwenService.findMatchingEvent(
        identifier,
        calendarEvents,
        conversationHistory
      );

      if (aiResult.success && aiResult.event) {
        return {
          success: true,
          event: aiResult.event,
          confidence: aiResult.confidence,
          message: aiResult.message,
        };
      }

      // Multiple matches - return list for user to choose
      return {
        success: false,
        message: `Multiple events found matching "${identifier}". Please be more specific:`,
        events: [],
        multipleMatches: true,
      };
    } catch (error) {
      console.error("Error resolving event identifier:", error);
      return {
        success: false,
        message: "Error searching for events. Please try again.",
      };
    }
  }

  /**
   * Check if message is a context continuation
   */
  async checkContextContinuation(text, userId) {
    const userSession = this.getUserSession(userId);
    const context = userSession.context;

    if (!context || !context.active) {
      return null;
    }

    const lowerText = text.toLowerCase();

    // Check for email addition context
    if (context.type === "event_update" && context.eventId) {
      if (
        lowerText.includes("email") ||
        lowerText.includes("@") ||
        lowerText.includes("add")
      ) {
        // Extract email from text
        const emailMatch = text.match(
          /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
        );
        if (emailMatch) {
          const email = emailMatch[1];
          return await this.continueEventUpdate(userId, context.eventId, {
            attendees: [email],
          });
        }
      }
    }

    // Check for other context continuations
    if (context.type === "event_update" && context.eventId) {
      if (lowerText.includes("location") || lowerText.includes("where")) {
        const locationMatch =
          text.match(/location[:\s]+(.+)/i) || text.match(/where[:\s]+(.+)/i);
        if (locationMatch) {
          const location = locationMatch[1].trim();
          return await this.continueEventUpdate(userId, context.eventId, {
            location,
          });
        }
      }

      if (lowerText.includes("description") || lowerText.includes("note")) {
        const descMatch =
          text.match(/description[:\s]+(.+)/i) || text.match(/note[:\s]+(.+)/i);
        if (descMatch) {
          const description = descMatch[1].trim();
          return await this.continueEventUpdate(userId, context.eventId, {
            description,
          });
        }
      }
    }

    return null;
  }

  /**
   * Continue event update with additional data
   */
  async continueEventUpdate(userId, eventId, updateData, user = null) {
    try {
      const result = await calendarService.updateEvent(
        eventId,
        updateData,
        user
      );

      // Clear context after successful update
      const userSession = this.getUserSession(userId);
      userSession.context = null;

      return {
        success: true,
        intent: "update_event",
        confidence: 0.95,
        response: result.message,
        data: {
          action: "update_event",
          event: result.event,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update user context after action
   */
  updateUserContext(userId, validationResult, actionResult) {
    const userSession = this.getUserSession(userId);

    // Set context for event updates
    if (
      validationResult.intent === "update_event" &&
      actionResult.data?.event?.id
    ) {
      userSession.context = {
        active: true,
        type: "event_update",
        eventId: actionResult.data.event.id,
        timestamp: Date.now(),
      };
    } else {
      // Clear context for other intents
      userSession.context = null;
    }
  }

  /**
   * Generate AI notes for an event
   */
  async generateEventNotes(event) {
    try {
      const prompt = `Generate helpful notes and preparation tips for this calendar event:
      
Title: ${event.summary}
Date: ${event.start.dateTime || event.start.date}
Location: ${event.location || "Not specified"}
Description: ${event.description || "No description provided"}
Attendees: ${event.attendees?.map((a) => a.email).join(", ") || "Not specified"}

Provide 3-5 bullet points with practical preparation tips and talking points.`;

      const notes = await qwenService.generateChatResponse(prompt);
      return notes;
    } catch (error) {
      return "Unable to generate notes at this time.";
    }
  }

  /**
   * Generate clarification message for missing fields
   */
  generateClarificationMessage(intent, missingFields, existingFields) {
    const fieldNames = {
      title: "event title",
      date: "date",
      time: "time",
      location: "location",
      attendees: "attendees",
      description: "description",
      event_identifier: "event identifier",
      followupDays: "number of days for follow-up",
    };

    const missingFieldNames = missingFields.map(
      (field) => fieldNames[field] || field
    );

    if (missingFieldNames.length === 1) {
      return `I need the ${missingFieldNames[0]} to ${this.getIntentAction(
        intent
      )}. Please provide it.`;
    } else {
      return `I need the following information to ${this.getIntentAction(
        intent
      )}: ${missingFieldNames.join(", ")}. Please provide these details.`;
    }
  }

  /**
   * Get action description for intent
   */
  getIntentAction(intent) {
    const actions = {
      [INTENTS.CREATE_EVENT]: "create the event",
      [INTENTS.UPDATE_EVENT]: "update the event",
      [INTENTS.CANCEL_EVENT]: "cancel the event",
      [INTENTS.PREPARE_EVENT]: "prepare for the event",
      [INTENTS.FOLLOWUP_EVENT]: "schedule the follow-up",
    };

    return actions[intent] || "complete this action";
  }

  /**
   * Get user session data
   */
  getUserSession(userId) {
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, {
        conversationHistory: [],
        pendingIntent: null,
        lastActivity: Date.now(),
      });
    }

    return this.userSessions.get(userId);
  }

  /**
   * Update user session with new message
   */
  updateUserSession(userId, message, response) {
    const session = this.getUserSession(userId);
    session.conversationHistory.push(
      { role: "user", content: message, timestamp: Date.now() },
      { role: "assistant", content: response, timestamp: Date.now() }
    );

    // Keep only last 20 messages
    if (session.conversationHistory.length > 20) {
      session.conversationHistory = session.conversationHistory.slice(-20);
    }

    session.lastActivity = Date.now();
  }

  /**
   * Clean up old user sessions
   */
  cleanupOldSessions() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [userId, session] of this.userSessions.entries()) {
      if (now - session.lastActivity > maxAge) {
        this.userSessions.delete(userId);
      }
    }
  }

  /**
   * Execute get information action
   */
  async executeGetInformation(fields) {
    try {
      // For now, return a helpful response about available features
      return {
        success: true,
        type: "chat",
        message: `I can help you with calendar management tasks. Here's what I can do:

📅 **Calendar Actions:**
• Create events: "Schedule a meeting with John tomorrow at 2 PM"
• Update events: "Change my 3 PM meeting to 4 PM"
• Cancel events: "Cancel my meeting tomorrow"
• Prepare for events: "What do I need for my presentation tomorrow?"
• Create follow-ups: "Set up a follow-up meeting in 3 days"

💡 **Tips:**
• Always include a clear title for events so you can find them later
• Specify dates and times clearly
• I can add attendees, locations, and descriptions

What would you like to do?`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Execute help request action
   */
  async executeHelpRequest(fields) {
    try {
      return {
        success: true,
        type: "chat",
        message: `I'm your calendar assistant! Here's how to use me:

**Creating Events:**
"Create an event for me tomorrow with John at 13:00 to discuss the project"

**Finding Events:**
"Show me my meetings tomorrow"
"What events do I have this week?"

**Managing Events:**
"Cancel my 3 PM meeting"
"Move my meeting to 4 PM"
"Add Sarah to my meeting tomorrow"

**Getting Help:**
"Help me prepare for my presentation tomorrow"
"Set up a follow-up meeting in 3 days"

Just tell me what you need in natural language!`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Execute general chat action
   */
  async executeGeneralChat(fields) {
    try {
      // For general chat, provide helpful information about calendar features
      return {
        success: true,
        type: "chat",
        message:
          "I'm your calendar assistant! I can help you with:\n\n📅 Creating and managing calendar events\n📋 Finding your upcoming meetings\n✏️ Updating or canceling events\n\nWhat would you like to do with your calendar?",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new IntentProcessor();
