import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { User, Calendar, Settings, LogOut, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';

const UserProfile: React.FC = () => {
  const { user, logout, updateUser, checkCalendarStatus } = useAuth();
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [calendarStatus, setCalendarStatus] = useState<{
    isConnected: boolean;
    isLoading: boolean;
  }>({
    isConnected: user?.isCalendarConnected || false,
    isLoading: false
  });

  // Update calendar status when user changes
  useEffect(() => {
    if (user) {
      setCalendarStatus(prev => ({
        ...prev,
        isConnected: user.isCalendarConnected
      }));
    }
  }, [user]);

  // Debug function to check auth state
  const debugAuthState = () => {
    const token = document.cookie.split(';').find(c => c.trim().startsWith('auth_token='));
    const refreshToken = document.cookie.split(';').find(c => c.trim().startsWith('refresh_token='));
    console.log('Debug auth state:');
    console.log('User:', user);
    console.log('Auth token cookie:', token);
    console.log('Refresh token cookie:', refreshToken);
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleCalendarDisconnect = async () => {
    setIsUpdating(true);
    try {
      await axios.post('/auth/calendar/disconnect');
      updateUser({ isCalendarConnected: false });
      setCalendarStatus({ isConnected: false, isLoading: false });
    } catch (error) {
      console.error('Failed to disconnect calendar:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCalendarConnect = () => {
    // Redirect to Google OAuth for calendar access
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/google`;
  };

  const handleCheckCalendarStatus = async () => {
    setCalendarStatus(prev => ({ ...prev, isLoading: true }));
    try {
      console.log('Checking calendar status from UserProfile...');
      const isConnected = await checkCalendarStatus();
      setCalendarStatus({ isConnected, isLoading: false });
      console.log('Calendar status checked successfully:', isConnected);
    } catch (error) {
      console.error('Failed to check calendar status:', error);
      setCalendarStatus(prev => ({ ...prev, isLoading: false }));
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-700/80 transition-colors"
      >
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="w-8 h-8 rounded-full ring-2 ring-slate-200 dark:ring-slate-600"
          />
        ) : (
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center ring-2 ring-slate-200 dark:ring-slate-600">
            <User className="w-4 h-4 text-white" />
          </div>
        )}
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:block">
          {user.name}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-[9999]">
            <div className="p-4">
              {/* User Info */}
              <div className="flex items-center space-x-3 mb-4">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-12 h-12 rounded-full ring-2 ring-slate-200 dark:ring-slate-600"
                  />
                ) : (
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center ring-2 ring-slate-200 dark:ring-slate-600">
                    <User className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{user.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                </div>
              </div>

              {/* Calendar Status */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Google Calendar
                    </span>
                  </div>
                  {calendarStatus.isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  ) : calendarStatus.isConnected ? (
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  )}
                </div>
                
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  {calendarStatus.isConnected
                    ? 'Connected - You can manage calendar events'
                    : 'Not connected - Connect to manage events'
                  }
                </p>

                {calendarStatus.isConnected ? (
                  <button
                    onClick={handleCalendarDisconnect}
                    disabled={isUpdating}
                    className="w-full text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 py-2 px-3 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? 'Disconnecting...' : 'Disconnect Calendar'}
                  </button>
                ) : (
                  <button
                    onClick={handleCalendarConnect}
                    className="w-full text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 py-2 px-3 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                  >
                    Connect Calendar
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // You could add settings functionality here
                  }}
                  className="w-full flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 py-2 px-3 rounded transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>

                <button
                  onClick={() => {
                    debugAuthState();
                    handleCheckCalendarStatus();
                  }}
                  className="w-full flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 py-2 px-3 rounded transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Debug Auth & Check Calendar</span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 py-2 px-3 rounded transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfile;
