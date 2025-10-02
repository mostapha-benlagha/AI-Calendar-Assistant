import React from 'react';
import { Calendar, Wifi, WifiOff, RefreshCw, Link, CheckCircle, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import UserProfile from './UserProfile';

interface ChatHeaderProps {
  isConnected: boolean;
  isCalendarLinked: boolean;
  onRetryConnection: () => void;
  onLinkCalendar: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  isConnected, 
  isCalendarLinked,
  onRetryConnection,
  onLinkCalendar
}) => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  return (
    <div className="relative z-10 bg-white/95 dark:bg-slate-800/95 border-b border-slate-200 dark:border-slate-700 px-3 sm:px-6 py-3 sm:py-5 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-soft-lg animate-float flex-shrink-0">
            <Calendar className="w-4 h-4 sm:w-7 sm:h-7 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-2xl font-bold text-slate-900 dark:text-slate-100 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text truncate">
              AI Calendar Assistant
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium hidden sm:block">
              Intelligent scheduling and calendar management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100/80 dark:bg-slate-700/80 hover:bg-slate-200/80 dark:hover:bg-slate-600/80 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-300" />
            ) : (
              <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-300" />
            )}
          </button>

          {/* Calendar Status - Hidden on very small screens */}
          <div className="hidden sm:flex items-center gap-2">
            {isCalendarLinked ? (
              <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1.5 sm:py-2 bg-success-50/80 dark:bg-success-900/30 rounded-xl border border-success-200/50 dark:border-success-700/50">
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success-600 dark:text-success-400" />
                <span className="text-xs sm:text-sm text-success-700 dark:text-success-300 font-medium hidden sm:inline">Calendar Linked</span>
                <span className="text-xs text-success-700 dark:text-success-300 font-medium sm:hidden">Linked</span>
              </div>
            ) : (
              <button
                onClick={onLinkCalendar}
                className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1.5 sm:py-2 bg-info-50/80 dark:bg-info-900/30 rounded-xl border border-info-200/50 dark:border-info-700/50 hover:bg-info-100/80 dark:hover:bg-info-800/30 transition-colors"
              >
                <Link className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-info-600 dark:text-info-400" />
                <span className="text-xs sm:text-sm text-info-700 dark:text-info-300 font-medium hidden sm:inline">Link Calendar</span>
                <span className="text-xs text-info-700 dark:text-info-300 font-medium sm:hidden">Link</span>
              </button>
            )}
          </div>

          {/* Connection Status - Simplified on mobile */}
          <div className="flex items-center gap-1 sm:gap-2">
            {isConnected ? (
              <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1.5 sm:py-2 bg-success-50/80 dark:bg-success-900/30 rounded-xl border border-success-200/50 dark:border-success-700/50">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-success-500 dark:bg-success-400 rounded-full animate-pulse"></div>
                <Wifi className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success-600 dark:text-success-400" />
                <span className="text-xs sm:text-sm text-success-700 dark:text-success-300 font-medium hidden sm:inline">Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1.5 sm:py-2 bg-accent-50/80 dark:bg-accent-900/30 rounded-xl border border-accent-200/50 dark:border-accent-700/50">
                <WifiOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent-500 dark:text-accent-400" />
                <span className="text-xs sm:text-sm text-accent-600 dark:text-accent-300 font-medium hidden sm:inline">Disconnected</span>
                <button
                  onClick={onRetryConnection}
                  className="btn-ghost text-accent-600 hover:text-accent-800 dark:text-accent-400 dark:hover:text-accent-200 flex items-center gap-1 text-xs px-1.5 sm:px-2 py-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span className="hidden sm:inline">Retry</span>
                </button>
              </div>
            )}
          </div>
          <UserProfile />
        </div>
      </div>
    </div>
  );
};

