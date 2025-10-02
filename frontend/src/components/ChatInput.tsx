import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  disabled = false,
}) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/95 dark:bg-slate-800/95 border-t border-slate-200 dark:border-slate-700 p-3 sm:p-4 backdrop-blur-md space-y-2"
    >
      <div className="flex gap-3 sm:gap-4 items-end">
        <div className="flex-1 flex flex-row items-center">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            className="input-field resize-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            rows={1}
            disabled={isLoading || disabled}
          />
        </div>

        <button
          type="submit"
          disabled={!message.trim() || isLoading || disabled}
          className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center bg-primary-500 text-white rounded-xl shadow-lg hover:shadow-soft transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
        <span className="hidden sm:inline">Press Enter to send, Shift+Enter for new line</span>
        <span className="sm:hidden">Enter to send</span>
      </div>
    </form>
  );
};
