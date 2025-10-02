const INTENTS = {
  // Agenda & Scheduling Intents
  CREATE_EVENT: "create_event",
  UPDATE_EVENT: "update_event",
  CANCEL_EVENT: "cancel_event",
  PREPARE_EVENT: "prepare_event",
  FOLLOWUP_EVENT: "followup_event",
  LIST_EVENTS: "list_events", // catch-all for calendar/event info requests

  // System Intents
  GET_INFORMATION: "get_information",
  HELP_REQUEST: "help_request",
  GENERAL_CHAT: "general_chat",
};

const INTENT_CATEGORIES = {
  AGENDA_SCHEDULING: [
    INTENTS.CREATE_EVENT,
    INTENTS.UPDATE_EVENT,
    INTENTS.CANCEL_EVENT,
    INTENTS.PREPARE_EVENT,
    INTENTS.FOLLOWUP_EVENT,
    INTENTS.LIST_EVENTS,
  ],
  SYSTEM: [INTENTS.GET_INFORMATION, INTENTS.HELP_REQUEST, INTENTS.GENERAL_CHAT],
};

const REQUIRED_FIELDS = {
  [INTENTS.CREATE_EVENT]: ["title", "date", "time"],
  [INTENTS.UPDATE_EVENT]: ["event_identifier"],
  [INTENTS.CANCEL_EVENT]: ["event_identifier"],
  [INTENTS.PREPARE_EVENT]: ["event_identifier"],
  [INTENTS.FOLLOWUP_EVENT]: ["event_identifier", "followupDays"],
  [INTENTS.LIST_EVENTS]: [], // no required fields
  [INTENTS.GET_INFORMATION]: [],
  [INTENTS.HELP_REQUEST]: [],
  [INTENTS.GENERAL_CHAT]: [],
};

const OPTIONAL_FIELDS = {
  [INTENTS.CREATE_EVENT]: [
    "end",
    "duration",
    "location",
    "attendees",
    "description",
  ],
  [INTENTS.UPDATE_EVENT]: [
    "title",
    "date",
    "time",
    "end",
    "duration",
    "location",
    "attendees",
    "description",
  ],
  [INTENTS.CANCEL_EVENT]: [],
  [INTENTS.PREPARE_EVENT]: [],
  [INTENTS.FOLLOWUP_EVENT]: [
    "title",
    "date",
    "time",
    "end",
    "duration",
    "location",
    "attendees",
    "description",
  ],
  [INTENTS.LIST_EVENTS]: ["userMessage", "date", "attendees"], // can filter by date/attendee if extracted
  [INTENTS.GET_INFORMATION]: [],
  [INTENTS.HELP_REQUEST]: [],
  [INTENTS.GENERAL_CHAT]: [],
};

const CONFIDENCE_THRESHOLD = 0.7;

module.exports = {
  INTENTS,
  INTENT_CATEGORIES,
  REQUIRED_FIELDS,
  OPTIONAL_FIELDS,
  CONFIDENCE_THRESHOLD,
};
