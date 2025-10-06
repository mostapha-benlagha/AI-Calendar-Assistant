import { format } from "date-fns";
import { AlertCircle, Bot, User } from "lucide-react";
import React from "react";
import { Message } from "../types";
import { EventCard, EventItem } from "./EventCard";

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === "user";
  const isError = message.type === "error";
  const isEvent = message.type === "event";
  const isEvents = message.type === "events";

  const formatTime = (timestamp: Date) => {
    return format(timestamp, "h:mm a");
  };

  // Format text with basic markdown-like formatting
  const formatMessageText = (text: string) => {
    return (
      text
        // Bold text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        // Italic text
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        // Code blocks
        .replace(/`(.*?)`/g, "<code>$1</code>")
        // Line breaks
        .replace(/\n/g, "<br>")
        // Bullet points
        .replace(/^[-•]\s+(.+)$/gm, "<li>$1</li>")
        // Numbered lists
        .replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>")
    );
  };

  return (
    <div
      className={`flex gap-3 sm:gap-4 mb-4 sm:mb-6 ${
        isUser ? "justify-end" : "justify-start"
      } animate-slide-up`}
    >
      {!isUser && (
        <div className="flex-shrink-0">
          <div
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shadow-soft ${
              isError
                ? "bg-accent-100 dark:bg-accent-900/30 border border-accent-200 dark:border-accent-700/50"
                : "bg-gradient-primary"
            }`}
          >
            {isError ? (
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-accent-600 dark:text-accent-400" />
            ) : (
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            )}
          </div>
        </div>
      )}

      <div
        className={`flex flex-col max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-3xl ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`chat-message ${
            isUser
              ? "chat-message.user"
              : isError
              ? "bg-accent-50/80 dark:bg-accent-900/30 border-accent-200/50 dark:border-accent-700/50 text-accent-800 dark:text-accent-200 backdrop-blur-md"
              : "chat-message.assistant"
          }`}
        >
          {/* Always show the text response */}
          <div
            className={`whitespace-pre-wrap text-balance rich-text ${
              isUser
                ? "message-text-user"
                : isError
                ? "message-text-error"
                : "message-text-assistant"
            }`}
            dangerouslySetInnerHTML={{
              __html: formatMessageText(message.text),
            }}
          />

          {isEvents && message.data && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {message.data.events.map((event: any) => (
                <EventItem key={event.id} event={event} description={false} />
              ))}
            </div>
          )}

          {/* Show event card if available */}
          {isEvent && message.data && (
            <div className="mt-4">
              <EventCard eventData={message.data} />
            </div>
          )}
        </div>

        <div
          className={`text-xs text-slate-500 dark:text-slate-400 mt-1 sm:mt-2 px-1 ${
            isUser ? "text-right" : "text-left"
          }`}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center shadow-soft">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
          </div>
        </div>
      )}
    </div>
  );
};
