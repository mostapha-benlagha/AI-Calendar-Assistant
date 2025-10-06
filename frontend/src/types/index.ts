export interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
  type?: "text" | "event" | "error" | "events";
  data?: any;
}

export interface EventData {
  action:
    | "create_event"
    | "update_event"
    | "cancel_event"
    | "prepare_event"
    | "followup_event"
    | "calendar_info"
    | "multiple_intents";
  event?: {
    id: string;
    summary: string;
    description?: string;
    location?: string;
    start: {
      dateTime?: string;
      date?: string;
    };
    end: {
      dateTime?: string;
      date?: string;
    };
    attendees?: Array<{
      email: string;
      displayName?: string;
    }>;
  };
  events?: Array<{
    id: string;
    summary: string;
    description?: string;
    location?: string;
    start: {
      dateTime?: string;
      date?: string;
    };
    end: {
      dateTime?: string;
      date?: string;
    };
    attendees?: Array<{
      email: string;
      displayName?: string;
    }>;
  }>;
  totalCount?: number;
  notes?: string;
  eventId?: string;
  results?: Array<{
    success: boolean;
    intent: string;
    message: string;
    data?: any;
  }>;
  totalIntents?: number;
  successfulIntents?: number;
}

export interface ChatResponse {
  success: boolean;
  intent?: string;
  confidence?: number;
  response: string;
  data?: EventData;
  error?: string;
}

export interface User {
  id: string;
  name?: string;
  email?: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  user: User | null;
  isConnected: boolean;
  isCalendarLinked: boolean;
}
