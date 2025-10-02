import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Wait a moment for the auth context to process the callback
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (isAuthenticated) {
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          
          // Redirect to main app after a short delay
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Authentication failed. Please try again.');
          
          // Redirect to login after a delay
          setTimeout(() => {
            window.location.href = '/login';
          }, 3000);
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage('An error occurred during authentication.');
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      }
    };

    handleCallback();
  }, [isAuthenticated]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader className="w-12 h-12 text-indigo-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-600" />;
      case 'error':
        return <XCircle className="w-12 h-12 text-red-600" />;
      default:
        return <Loader className="w-12 h-12 text-indigo-600 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-indigo-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            {getIcon()}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {status === 'loading' && 'Authenticating...'}
            {status === 'success' && 'Welcome!'}
            {status === 'error' && 'Authentication Failed'}
          </h1>
          
          <p className={`text-lg mb-6 ${getStatusColor()}`}>
            {message}
          </p>
          
          {status === 'loading' && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
              <p className="text-sm text-gray-500">
                Please wait while we set up your account...
              </p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  Your Google Calendar has been connected successfully. 
                  You can now start chatting with your AI assistant!
                </p>
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  There was an issue with the authentication process. 
                  You'll be redirected to try again.
                </p>
              </div>
              <button
                onClick={() => window.location.href = '/login'}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
