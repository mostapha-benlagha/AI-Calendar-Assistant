import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { WelcomeMessage } from './WelcomeMessage';
import { Message } from '../types';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  onExampleClick?: (text: string) => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ 
  messages, 
  isLoading,
  onExampleClick
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return <WelcomeMessage onExampleClick={onExampleClick} />;
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
      <div className="max-w-4xl mx-auto">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <div className="flex gap-3 sm:gap-4 mb-6 animate-slide-up">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-soft">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
            <div className="flex-1">
              <div className="glass rounded-2xl p-4 sm:p-5 shadow-soft animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

