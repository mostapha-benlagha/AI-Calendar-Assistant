import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message, ChatResponse, ChatState } from '../types';
import { useAuth } from '../contexts/AuthContext';

// Simple UUID generator
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useChat = () => {
  const { user, isAuthenticated } = useAuth();
  
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    user: { id: user?._id || generateUUID() },
    isConnected: false,
    isCalendarLinked: user?.isCalendarConnected || false,
  });

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Update state when user changes
  useEffect(() => {
    if (user) {
      setState(prev => ({
        ...prev,
        user: { id: user._id },
        isCalendarLinked: user.isCalendarConnected,
      }));
    }
  }, [user]);

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      auth: {
        token: localStorage.getItem('auth_token') || undefined,
      },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to server');
      setState(prev => ({ ...prev, isConnected: true, error: null }));
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setState(prev => ({ ...prev, isConnected: false }));
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setState(prev => ({ 
        ...prev, 
        isConnected: false, 
        error: 'Connection failed. Please check your internet connection.' 
      }));
    });

    socket.on('chat_response', (response: ChatResponse) => {
      handleChatResponse(response);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'An error occurred' 
      }));
    });

    return () => {
      socket.disconnect();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isAuthenticated]);

  const handleChatResponse = useCallback((response: ChatResponse) => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      error: null,
    }));

    if (response.success) {
      // Determine message type based on intent and data
      let messageType: 'text' | 'event' | 'error' = 'text';
      
      if (response.data) {
        if (response.data.action === 'calendar_info' && response.data.events && response.data.events.length > 0) {
          messageType = 'event';
        } else if (response.data.action && ['create_event', 'update_event', 'cancel_event', 'prepare_event', 'followup_event'].includes(response.data.action)) {
          messageType = 'event';
        } else if (response.data.action === 'multiple_intents') {
          messageType = 'text'; // Multiple intents are displayed as formatted text
        }
      }
      
      // For list_events intent, always show as text since the response contains formatted text
      if (response.intent === 'list_events') {
        messageType = 'text';
      }
      
      // For multiple_intents, always show as text
      if (response.intent === 'multiple_intents') {
        messageType = 'text';
      }

      const message: Message = {
        id: generateUUID(),
        text: response.response,
        sender: 'assistant',
        timestamp: new Date(),
        type: messageType,
        data: response.data,
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, message],
      }));
    } else {
      const errorMessage: Message = {
        id: generateUUID(),
        text: response.error || 'An error occurred',
        sender: 'assistant',
        timestamp: new Date(),
        type: 'error',
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        error: response.error || 'An error occurred',
      }));
    }
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || state.isLoading) return;

    const userMessage: Message = {
      id: generateUUID(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      if (socketRef.current?.connected) {
        // Use WebSocket for real-time communication
        socketRef.current.emit('chat_message', {
          text: text.trim(),
          userId: state.user?.id,
        });
      } else {
        // Fallback to HTTP request
        const response = await fetch(`${API_BASE_URL}/api/webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text.trim(),
            userId: state.user?.id,
          }),
        });

        const data: ChatResponse = await response.json();
        handleChatResponse(data);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to send message. Please try again.',
      }));
    }
  }, [state.isLoading, state.user?.id, handleChatResponse]);

  const clearMessages = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      error: null,
    }));
  }, []);

  const retryConnection = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  }, []);

  const linkCalendar = useCallback(() => {
    // Redirect to Google OAuth flow
    window.location.href = `${API_BASE_URL}/auth/google`;
  }, []);


  return {
    ...state,
    sendMessage,
    clearMessages,
    retryConnection,
    linkCalendar,
  };
};
