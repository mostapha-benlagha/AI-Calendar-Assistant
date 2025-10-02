import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

interface User {
  _id: string;
  email: string;
  name: string;
  picture?: string;
  isCalendarConnected: boolean;
  preferences: {
    timezone: string;
    language: string;
    notifications: {
      email: boolean;
      calendar: boolean;
    };
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
  checkCalendarStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configure axios defaults
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
axios.defaults.baseURL = API_BASE_URL;

// Helper function to clear auth data
const clearAuthData = () => {
  console.log('Clearing all authentication data');
  Cookies.remove('auth_token');
  Cookies.remove('refresh_token');
  // Note: setToken and setUser will be called from the component context
};

// Add request interceptor to include auth token
axios.interceptors.request.use(
  (config) => {
    const token = Cookies.get('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry refresh requests or requests that have already been retried
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
      originalRequest._retry = true;

      const refreshToken = Cookies.get('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post('/auth/refresh', {
            refreshToken
          });

          const { token: newToken, refreshToken: newRefreshToken } = response.data.data;
          Cookies.set('auth_token', newToken, { expires: 7 });
          Cookies.set('refresh_token', newRefreshToken, { expires: 30 });

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axios(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          console.error('Token refresh failed:', refreshError);
          clearAuthData();
          
          // Only redirect if not already on login page
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, clear tokens and redirect to login
        clearAuthData();
        
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Initialize auth state from cookies
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = Cookies.get('auth_token');
      const savedRefreshToken = Cookies.get('refresh_token');

      if (savedToken) {
        setToken(savedToken);
        try {
          const response = await axios.get('/auth/profile');
          const userData = {
            ...response.data.data.user,
            isCalendarConnected: response.data.data.isCalendarConnected
          };
          setUser(userData);
          
          // Check calendar status after user is set
          await checkCalendarStatus();
        } catch (error) {
          console.error('Failed to get user profile:', error);
          // Token might be invalid, try to refresh
          if (savedRefreshToken) {
            try {
              const refreshed = await refreshToken();
              if (!refreshed) {
                // Refresh failed, clear tokens
                console.log('Token refresh failed during initialization, clearing tokens');
                Cookies.remove('auth_token');
                Cookies.remove('refresh_token');
                setToken(null);
                setUser(null);
              }
            } catch (refreshError) {
              console.error('Refresh token error during initialization:', refreshError);
              // Clear tokens on refresh error
              Cookies.remove('auth_token');
              Cookies.remove('refresh_token');
              setToken(null);
              setUser(null);
            }
          } else {
            // No refresh token, clear everything
            console.log('No refresh token found, clearing auth token');
            Cookies.remove('auth_token');
            setToken(null);
            setUser(null);
          }
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = () => {
    // Redirect to Google OAuth
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens and user data
      clearAuthData();
      setToken(null);
      setUser(null);
      window.location.href = '/login';
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = Cookies.get('refresh_token');
      if (!refreshTokenValue) {
        console.log('No refresh token available');
        return false;
      }

      console.log('Attempting to refresh token...');
      const response = await axios.post('/auth/refresh', {
        refreshToken: refreshTokenValue
      });

      if (response.data.success) {
        const { token: newToken, refreshToken: newRefreshToken } = response.data.data;
        Cookies.set('auth_token', newToken, { expires: 7 });
        Cookies.set('refresh_token', newRefreshToken, { expires: 30 });
        setToken(newToken);
        console.log('Token refreshed successfully');
        return true;
      } else {
        console.error('Token refresh failed:', response.data.error);
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed with error:', error);
      // Clear invalid tokens
      Cookies.remove('auth_token');
      Cookies.remove('refresh_token');
      setToken(null);
      setUser(null);
      return false;
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const checkCalendarStatus = async () => {
    try {
      console.log('Checking calendar status after user profile loaded...');
      const response = await axios.get('/auth/calendar/status');
      const isConnected = response.data.data.isConnected;
      console.log('Calendar status checked successfully:', isConnected);
      
      // Update user with calendar status
      setUser(prevUser => {
        if (prevUser) {
          const updatedUser = { ...prevUser, isCalendarConnected: isConnected };
          console.log('Updated user calendar connection status:', isConnected);
          return updatedUser;
        }
        return prevUser;
      });
      
      return isConnected;
    } catch (error) {
      console.error('Failed to check calendar status:', error);
      console.error('Error response:', error.response?.data);
      
      // Set calendar as disconnected on error
      setUser(prevUser => {
        if (prevUser) {
          const updatedUser = { ...prevUser, isCalendarConnected: false };
          console.log('Set user calendar connection status to false due to error');
          return updatedUser;
        }
        return prevUser;
      });
      
      return false;
    }
  };

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenParam = urlParams.get('token');
      const refreshParam = urlParams.get('refresh');

      if (tokenParam && refreshParam) {
        // Save tokens
        Cookies.set('auth_token', tokenParam, { expires: 7 });
        Cookies.set('refresh_token', refreshParam, { expires: 30 });
        setToken(tokenParam);

        // Get user profile
        axios.get('/auth/profile')
          .then(async response => {
            const userData = {
              ...response.data.data.user,
              isCalendarConnected: response.data.data.isCalendarConnected
            };
            setUser(userData);
            
            // Check calendar status after user is set
            await checkCalendarStatus();
            
            // Redirect to main app
            window.location.href = '/';
          })
          .catch(error => {
            console.error('Failed to get user profile after OAuth:', error);
            // Clear tokens on error
            Cookies.remove('auth_token');
            Cookies.remove('refresh_token');
            setToken(null);
            setUser(null);
          });
      }
    };

    // Check if we're on the OAuth callback page
    if (window.location.pathname === '/auth/callback') {
      handleOAuthCallback();
    }
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshToken,
    updateUser,
    checkCalendarStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
