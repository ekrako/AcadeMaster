'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface FlashMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface FlashContextType {
  messages: FlashMessage[];
  showFlash: (message: string, type: FlashMessage['type'], duration?: number) => void;
  removeFlash: (id: string) => void;
  clearAll: () => void;
}

const FlashContext = createContext<FlashContextType | undefined>(undefined);

export function FlashProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<FlashMessage[]>([]);

  const showFlash = (message: string, type: FlashMessage['type'], duration: number = 5000) => {
    const id = `flash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newMessage: FlashMessage = { id, message, type, duration };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeFlash(id);
      }, duration);
    }
  };

  const removeFlash = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const clearAll = () => {
    setMessages([]);
  };

  return (
    <FlashContext.Provider value={{ messages, showFlash, removeFlash, clearAll }}>
      {children}
    </FlashContext.Provider>
  );
}

export function useFlash() {
  const context = useContext(FlashContext);
  if (context === undefined) {
    throw new Error('useFlash must be used within a FlashProvider');
  }
  return context;
}