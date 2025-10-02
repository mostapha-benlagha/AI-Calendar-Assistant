import React from 'react';
import { Calendar, Clock, Users, MapPin, MessageSquare } from 'lucide-react';

interface WelcomeMessageProps {
  onExampleClick?: (text: string) => void;
}

export const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ onExampleClick }) => {
  const examples = [
    {
      icon: Calendar,
      text: "Schedule a meeting with John tomorrow at 2 PM",
      description: "Create new calendar events"
    },
    {
      icon: Clock,
      text: "What events do I have today?",
      description: "List your calendar events"
    },
    {
      icon: Users,
      text: "Do I have meetings with John this week?",
      description: "Search events by attendee"
    },
    {
      icon: MapPin,
      text: "Update my 3 PM meeting to 4 PM",
      description: "Modify existing events"
    },
    {
      icon: MessageSquare,
      text: "Cancel my team meeting on Friday",
      description: "Cancel events"
    }
  ];

  return (
    <div className="text-center py-6 sm:py-8 px-4 sm:px-6 overflow-auto flex-1">
      <div className="max-w-4xl mx-auto">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-primary flex items-center justify-center mx-auto mb-4 sm:mb-8 shadow-soft-lg animate-float">
          <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        </div>
        
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4 sm:mb-4 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text">
          Welcome to AI Calendar Assistant
        </h2>
        
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-8 sm:mb-8 text-balance max-w-2xl mx-auto leading-relaxed">
          I can help you manage your calendar, schedule meetings, and answer questions. 
          Try one of the examples below or ask me anything!
        </p>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8 sm:mb-8">
          {examples.map((example, index) => (
            <div
              key={index}
              className="glass card-hover group cursor-pointer"
              onClick={() => {
                if (onExampleClick) {
                  onExampleClick(example.text);
                }
              }}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center flex-shrink-0 group-hover:from-primary-100 group-hover:to-primary-200 dark:group-hover:from-primary-800 dark:group-hover:to-primary-700 transition-all duration-300">
                  <example.icon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-slate-300 group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 leading-snug">
                    {example.text}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {example.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="glass border border-info-200/50 dark:border-info-700/50 rounded-2xl p-4 sm:p-6 max-w-2xl mx-auto">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-info-100 dark:bg-info-900/30 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-4 h-4 text-info-600 dark:text-info-400" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-info-900 dark:text-info-100 mb-2">Getting Started</h3>
              <p className="text-sm text-info-800 dark:text-info-200 leading-relaxed">
                To use calendar features, you'll need to connect your Google Calendar. 
                Click the connection button above to get started.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

