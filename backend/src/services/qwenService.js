const axios = require("axios");
const config = require("../config");
const { INTENTS, CONFIDENCE_THRESHOLD } = require("../constants/intents");
const {
  buildIntentExtractionPrompt,
  buildEventListPrompt,
  buildEventSearchPrompt,
  buildChatPrompt,
} = require("../prompts/intentPrompts");

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
      const systemPrompt = buildIntentExtractionPrompt();
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
      const systemPrompt = buildChatPrompt();
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
      const systemPrompt = buildEventListPrompt();
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
      const systemPrompt = buildEventSearchPrompt();
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
