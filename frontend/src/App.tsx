import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useChat } from './hooks/useChat';
import { ChatHeader } from './components/ChatHeader';
import { ChatContainer } from './components/ChatContainer';
import { ChatInput } from './components/ChatInput';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginScreen from './components/LoginScreen';
import AuthCallback from './components/AuthCallback';
import UserProfile from './components/UserProfile';

// Chat App Component
const ChatApp: React.FC = () => {
  const {
    messages,
    isLoading,
    error,
    isConnected,
    isCalendarLinked,
    sendMessage,
    clearMessages,
    retryConnection,
    linkCalendar,
  } = useChat();

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-primary-50 to-info-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.03),transparent_50%)]"></div>
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.06),transparent_50%)] dark:bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.02),transparent_50%)] rounded-full"></div>
        <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.05),transparent_50%)] dark:bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.02),transparent_50%)] rounded-full"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <ChatHeader 
          isConnected={isConnected} 
          isCalendarLinked={isCalendarLinked}
          onRetryConnection={retryConnection} 
          onLinkCalendar={linkCalendar}
        />
        
        <ChatContainer 
          messages={messages} 
          isLoading={isLoading}
          onExampleClick={sendMessage}
        />
        
        <ChatInput 
          onSendMessage={sendMessage}
          isLoading={isLoading}
          disabled={!isConnected}
        />
        
        {error && (
          <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-50">
            <div className="glass border border-accent-200/50 dark:border-accent-800/50 rounded-2xl p-4 shadow-error animate-slide-up">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 text-accent-500 flex-shrink-0">⚠️</div>
                <p className="text-sm text-accent-800 dark:text-accent-200 flex-1">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-ghost text-accent-600 hover:text-accent-800 dark:text-accent-400 dark:hover:text-accent-200 text-xs px-2 py-1"
                >
                  Reload
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main App Component with Routing
function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <ChatApp />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;

