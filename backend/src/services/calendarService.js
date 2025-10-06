const { google } = require("googleapis");
const config = require("../config");
const moment = require("moment");
const fs = require("fs").promises;
const path = require("path");

class CalendarService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );

    this.calendar = google.calendar({ version: "v3", auth: this.oauth2Client });

    // Token storage file path
    this.tokenFilePath = path.join(__dirname, "../../tokens.json");
    this.tokens = null;

    // Load tokens on initialization
    this.loadTokens();
  }

  /**
   * Load tokens from file
   */
  async loadTokens() {
    try {
      const tokenData = await fs.readFile(this.tokenFilePath, "utf8");
      const tokens = JSON.parse(tokenData);
      this.tokens = tokens;
      this.oauth2Client.setCredentials(tokens);
      console.log("✅ Calendar tokens loaded successfully");
    } catch (error) {
      console.log("ℹ️ No existing calendar tokens found");
      this.tokens = null;
    }
  }

  /**
   * Save tokens to file
   * @param {Object} tokens - OAuth2 tokens
   */
  async saveTokens(tokens) {
    try {
      await fs.writeFile(this.tokenFilePath, JSON.stringify(tokens, null, 2));
      console.log("✅ Calendar tokens saved successfully");
    } catch (error) {
      console.error("❌ Error saving calendar tokens:", error);
    }
  }

  /**
   * Set credentials for the OAuth2 client
   * @param {Object} tokens - OAuth2 tokens
   */
  async setCredentials(tokens) {
    this.tokens = tokens;
    this.oauth2Client.setCredentials(tokens);
    await this.saveTokens(tokens);
  }

  /**
   * Get authorization URL for OAuth2 flow
   * @returns {string} - Authorization URL
   */
  getAuthUrl() {
    const scopes = ["https://www.googleapis.com/auth/calendar"];

    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
    });
  }

  /**
   * Exchange authorization code for tokens
   * @param {string} code - Authorization code
   * @returns {Promise<Object>} - OAuth2 tokens
   */
  async getTokens(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      await this.setCredentials(tokens);
      return tokens;
    } catch (error) {
      console.error("Error getting tokens:", error);
      throw new Error("Failed to exchange authorization code for tokens");
    }
  }

  /**
   * Create a new calendar event
   * @param {Object} eventData - Event data
   * @param {Object} user - User object with calendar tokens
   * @returns {Promise<Object>} - Created event
   */
  async createEvent(eventData, user = null) {
    try {
      // Use user's tokens if provided, otherwise use stored tokens
      if (user && user.calendarKeys.accessToken) {
        this.oauth2Client.setCredentials({
          access_token: user.calendarKeys.accessToken,
          refresh_token: user.calendarKeys.refreshToken,
          expiry_date: user.calendarKeys.tokenExpiry?.getTime(),
        });
      } else if (!this.tokens) {
        throw new Error(
          "Calendar not authenticated. Please complete OAuth flow first."
        );
      }

      const event = this.formatEventData(eventData);
      const calendarId =
        user?.calendarKeys.calendarId || config.google.calendarId;

      const response = await this.calendar.events.insert({
        calendarId: calendarId,
        resource: event,
      });

      return {
        success: true,
        event: response.data,
        message: `Event "${event.summary}" created successfully`,
      };
    } catch (error) {
      console.error("Error creating event:", error);
      throw new Error("Failed to create calendar event");
    }
  }

  /**
   * Update an existing calendar event
   * @param {string} eventId - Event ID
   * @param {Object} updateData - Updated event data
   * @param {Object} user - User object with calendar tokens
   * @returns {Promise<Object>} - Updated event
   */
  async updateEvent(eventId, updateData, user = null) {
    try {
      // Use user's tokens if provided, otherwise use stored tokens
      if (user && user.calendarKeys.accessToken) {
        this.oauth2Client.setCredentials({
          access_token: user.calendarKeys.accessToken,
          refresh_token: user.calendarKeys.refreshToken,
          expiry_date: user.calendarKeys.tokenExpiry?.getTime(),
        });
      } else if (!this.tokens) {
        throw new Error(
          "Calendar not authenticated. Please complete OAuth flow first."
        );
      }

      const calendarId =
        user?.calendarKeys.calendarId || config.google.calendarId;

      // First get the existing event
      const existingEvent = await this.calendar.events.get({
        calendarId: calendarId,
        eventId: eventId,
      });

      // Merge with new data
      const updatedEvent = this.mergeEventData(existingEvent.data, updateData);

      const response = await this.calendar.events.update({
        calendarId: calendarId,
        eventId: eventId,
        resource: updatedEvent,
      });

      return {
        success: true,
        event: response.data,
        message: `Event "${updatedEvent.summary}" updated successfully`,
      };
    } catch (error) {
      console.error("Error updating event:", error);
      throw new Error("Failed to update calendar event");
    }
  }

  /**
   * Cancel/delete a calendar event
   * @param {string} eventId - Event ID
   * @param {Object} user - User object with calendar tokens
   * @returns {Promise<Object>} - Deletion result
   */
  async cancelEvent(eventId, user = null) {
    try {
      // Use user's tokens if provided, otherwise use stored tokens
      if (user && user.calendarKeys.accessToken) {
        this.oauth2Client.setCredentials({
          access_token: user.calendarKeys.accessToken,
          refresh_token: user.calendarKeys.refreshToken,
          expiry_date: user.calendarKeys.tokenExpiry?.getTime(),
        });
      } else if (!this.tokens) {
        throw new Error(
          "Calendar not authenticated. Please complete OAuth flow first."
        );
      }

      const calendarId =
        user?.calendarKeys.calendarId || config.google.calendarId;

      await this.calendar.events.delete({
        calendarId: calendarId,
        eventId: eventId,
      });

      return {
        success: true,
        message: "Event cancelled successfully",
      };
    } catch (error) {
      console.error("Error cancelling event:", error);
      throw new Error("Failed to cancel calendar event");
    }
  }

  /**
   * Get event details for preparation
   * @param {string} eventId - Event ID
   * @param {Object} user - User object with calendar tokens
   * @returns {Promise<Object>} - Event details
   */
  async getEvent(eventId, user = null) {
    try {
      // Use user's tokens if provided, otherwise use stored tokens
      if (user && user.calendarKeys.accessToken) {
        this.oauth2Client.setCredentials({
          access_token: user.calendarKeys.accessToken,
          refresh_token: user.calendarKeys.refreshToken,
          expiry_date: user.calendarKeys.tokenExpiry?.getTime(),
        });
      } else if (!this.tokens) {
        throw new Error(
          "Calendar not authenticated. Please complete OAuth flow first."
        );
      }

      const calendarId =
        user?.calendarKeys.calendarId || config.google.calendarId;

      const response = await this.calendar.events.get({
        calendarId: calendarId,
        eventId: eventId,
      });

      return {
        success: true,
        event: response.data,
      };
    } catch (error) {
      console.error("Error getting event:", error);
      throw new Error("Failed to retrieve event details");
    }
  }

  /**
   * Search for events by identifier
   * @param {string} identifier - Event identifier (title, date, etc.)
   * @param {Object} user - User object with calendar tokens
   * @returns {Promise<Array>} - Matching events
   */
  async searchEvents(identifier, user = null) {
    try {
      // Use user's tokens if provided, otherwise use stored tokens
      if (user && user.calendarKeys.accessToken) {
        this.oauth2Client.setCredentials({
          access_token: user.calendarKeys.accessToken,
          refresh_token: user.calendarKeys.refreshToken,
          expiry_date: user.calendarKeys.tokenExpiry?.getTime(),
        });
      } else if (!this.tokens) {
        throw new Error(
          "Calendar not authenticated. Please complete OAuth flow first."
        );
      }

      const timeMin = new Date(
        Date.now() - 365 * 24 * 60 * 60 * 1000
      ).toISOString(); // 1 year before today
      const timeMax = new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      ).toISOString(); // 1 year after today
      const calendarId =
        user?.calendarKeys.calendarId || config.google.calendarId;

      const response = await this.calendar.events.list({
        calendarId: calendarId,
        timeMin: timeMin,
        timeMax: timeMax,
        timeZone: "UTC",
        maxResults: 2500,
        singleEvents: true,
        orderBy: "startTime",
      });

      const events = response.data.items || [];

      // Filter events by identifier if provided
      let matchingEvents = events;
      if (identifier && identifier.trim() !== "") {
        const searchTerm = identifier.toLowerCase().trim();

        // Split search term into words for better matching
        const searchWords = searchTerm
          .split(/\s+/)
          .filter((word) => word.length > 0);

        matchingEvents = events.filter((event) => {
          const title = event.summary?.toLowerCase() || "";
          const description = event.description?.toLowerCase() || "";

          // Exact match (highest priority)
          if (title === searchTerm || description === searchTerm) {
            return true;
          }

          // Contains exact phrase
          if (title.includes(searchTerm) || description.includes(searchTerm)) {
            return true;
          }

          // Word-based matching - check if all search words are found
          if (searchWords.length > 1) {
            const allWordsFound = searchWords.every(
              (word) => title.includes(word) || description.includes(word)
            );
            if (allWordsFound) {
              return true;
            }
          }

          // Partial word matching - check if any significant word matches
          const significantWords = searchWords.filter(
            (word) => word.length >= 3
          );
          if (significantWords.length > 0) {
            const anySignificantWordFound = significantWords.some(
              (word) => title.includes(word) || description.includes(word)
            );
            if (anySignificantWordFound) {
              return true;
            }
          }

          // Fuzzy matching for single words
          if (searchWords.length === 1) {
            const word = searchWords[0];
            // Check if the word is contained in any word of the title
            const titleWords = title.split(/\s+/);
            const descriptionWords = description.split(/\s+/);

            const fuzzyMatch =
              titleWords.some(
                (titleWord) =>
                  titleWord.includes(word) || word.includes(titleWord)
              ) ||
              descriptionWords.some(
                (descWord) => descWord.includes(word) || word.includes(descWord)
              );

            if (fuzzyMatch) {
              return true;
            }
          }

          return false;
        });
      }

      return {
        success: true,
        events: matchingEvents,
      };
    } catch (error) {
      console.error("Error searching events:", error);
      throw new Error("Failed to search calendar events");
    }
  }

  /**
   * Create a follow-up event based on an existing event
   * @param {string} originalEventId - Original event ID
   * @param {number} followupDays - Days to schedule follow-up
   * @param {Object} customData - Custom data for follow-up event
   * @param {Object} user - User object with calendar tokens
   * @returns {Promise<Object>} - Created follow-up event
   */
  async createFollowupEvent(
    originalEventId,
    followupDays,
    customData = {},
    user = null
  ) {
    try {
      // Get the original event
      const originalEvent = await this.getEvent(originalEventId, user);

      if (!originalEvent.success) {
        throw new Error("Original event not found");
      }

      const event = originalEvent.event;
      const startTime = new Date(event.start.dateTime || event.start.date);
      const followupTime = new Date(
        startTime.getTime() + followupDays * 24 * 60 * 60 * 1000
      );

      // Create follow-up event data
      const followupEventData = {
        title: customData.title || `Follow-up: ${event.summary}`,
        date: followupTime.toISOString().split("T")[0],
        time: startTime.toTimeString().split(" ")[0].substring(0, 5),
        location: customData.location || event.location,
        description:
          customData.description || `Follow-up meeting for: ${event.summary}`,
        attendees:
          customData.attendees || event.attendees?.map((a) => a.email) || [],
      };

      return await this.createEvent(followupEventData, user);
    } catch (error) {
      console.error("Error creating follow-up event:", error);
      throw new Error("Failed to create follow-up event");
    }
  }

  /**
   * Format event data for Google Calendar API
   * @param {Object} eventData - Raw event data
   * @returns {Object} - Formatted event
   */
  formatEventData(eventData) {
    const {
      title,
      date,
      time,
      end,
      duration,
      location,
      attendees,
      description,
      recurrence,
    } = eventData;

    // Parse date and time
    const startDateTime = moment(`${date} ${time}`, "YYYY-MM-DD HH:mm");
    let endDateTime;

    if (end) {
      endDateTime = moment(`${date} ${end}`, "YYYY-MM-DD HH:mm");
    } else if (duration) {
      endDateTime = startDateTime.clone().add(duration, "minutes");
    } else {
      endDateTime = startDateTime.clone().add(1, "hour"); // Default 1 hour
    }

    // Ensure event has a meaningful title for easy retrieval
    let eventTitle = title;
    if (!eventTitle || eventTitle.trim() === "") {
      eventTitle = `Meeting on ${startDateTime.format(
        "MMM DD, YYYY"
      )} at ${startDateTime.format("HH:mm")}`;
    }

    // Build a comprehensive description for better searchability
    let eventDescription = description || "";
    if (attendees && attendees.length > 0) {
      const attendeeList = attendees.join(", ");
      eventDescription +=
        (eventDescription ? "\n\n" : "") + `Attendees: ${attendeeList}`;
    }
    if (location) {
      eventDescription +=
        (eventDescription ? "\n\n" : "") + `Location: ${location}`;
    }

    const event = {
      summary: eventTitle,
      description: eventDescription,
      location: location || "",
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: "UTC",
      },
      recurrence: [recurrence] || [],
    };

    // Add attendees if provided (only valid email addresses)
    if (attendees && attendees.length > 0) {
      const validAttendees = attendees
        .filter((email) => this.isValidEmail(email))
        .map((email) => ({ email }));

      if (validAttendees.length > 0) {
        event.attendees = validAttendees;
      } else {
        // If no valid emails, add attendees as display names in description
        const attendeeNames = attendees.filter((name) => name && name.trim());
        if (attendeeNames.length > 0) {
          const attendeeText = attendeeNames.join(", ");
          event.description = event.description
            ? `${event.description}\n\nAttendees: ${attendeeText}`
            : `Attendees: ${attendeeText}`;
        }
      }
    }

    return event;
  }

  /**
   * Validate email address format
   * @param {string} email - Email address to validate
   * @returns {boolean} - True if valid email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Merge existing event data with update data
   * @param {Object} existingEvent - Existing event
   * @param {Object} updateData - Update data
   * @returns {Object} - Merged event
   */
  mergeEventData(existingEvent, updateData) {
    const merged = { ...existingEvent };

    if (updateData.title) {
      merged.summary = updateData.title;
    }

    if (updateData.description) {
      merged.description = updateData.description;
    }

    if (updateData.location) {
      merged.location = updateData.location;
    }

    if (updateData.date && updateData.time) {
      const startDateTime = moment(
        `${updateData.date} ${updateData.time}`,
        "YYYY-MM-DD HH:mm"
      );
      merged.start = {
        dateTime: startDateTime.toISOString(),
        timeZone: "UTC",
      };

      if (updateData.end) {
        const endDateTime = moment(
          `${updateData.date} ${updateData.end}`,
          "YYYY-MM-DD HH:mm"
        );
        merged.end = {
          dateTime: endDateTime.toISOString(),
          timeZone: "UTC",
        };
      } else if (updateData.duration) {
        const endDateTime = startDateTime
          .clone()
          .add(updateData.duration, "minutes");
        merged.end = {
          dateTime: endDateTime.toISOString(),
          timeZone: "UTC",
        };
      } else {
        // If no end time or duration specified, preserve the original duration
        const originalStart = moment(existingEvent.start.dateTime);
        const originalEnd = moment(existingEvent.end.dateTime);
        const originalDuration = originalEnd.diff(originalStart, "minutes");

        const endDateTime = startDateTime
          .clone()
          .add(originalDuration, "minutes");
        merged.end = {
          dateTime: endDateTime.toISOString(),
          timeZone: "UTC",
        };
      }
    }

    if (updateData.attendees) {
      const validAttendees = updateData.attendees
        .filter((email) => this.isValidEmail(email))
        .map((email) => ({ email }));

      if (validAttendees.length > 0) {
        merged.attendees = validAttendees;
      } else {
        // If no valid emails, add attendees as display names in description
        const attendeeNames = updateData.attendees.filter(
          (name) => name && name.trim()
        );
        if (attendeeNames.length > 0) {
          const attendeeText = attendeeNames.join(", ");
          merged.description = merged.description
            ? `${merged.description}\n\nAttendees: ${attendeeText}`
            : `Attendees: ${attendeeText}`;
        }
      }
    }

    return merged;
  }
}

module.exports = new CalendarService();
