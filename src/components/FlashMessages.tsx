'use client';

import { useFlash } from '@/contexts/FlashContext';
import { useEffect, useState } from 'react';

export default function FlashMessages() {
  const { messages, removeFlash } = useFlash();

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2 w-full max-w-md px-4">
      {messages.map((message) => (
        <FlashMessage
          key={message.id}
          message={message}
          onRemove={() => removeFlash(message.id)}
        />
      ))}
    </div>
  );
}

interface FlashMessageProps {
  message: {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  };
  onRemove: () => void;
}

function FlashMessage({ message, onRemove }: FlashMessageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(onRemove, 300); // Wait for animation to complete
  };

  const getStyles = () => {
    switch (message.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIcon = () => {
    switch (message.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isRemoving ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}
        ${getStyles()}
        border rounded-lg p-4 shadow-lg
      `}
      role="alert"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-lg flex-shrink-0">{getIcon()}</span>
          <div className="flex-1">
            <p className="text-sm font-medium">{message.message}</p>
          </div>
        </div>
        <button
          onClick={handleRemove}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-3"
          aria-label="סגור הודעה"
        >
          <span className="text-lg">×</span>
        </button>
      </div>
    </div>
  );
}