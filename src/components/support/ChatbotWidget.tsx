import React, { useState } from 'react';
import { MessageCircle, X, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import ChatbotInterface from './ChatbotInterface';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { isAdmin } = useUserRole();
  const { user } = useAuth();

  // Don't show chatbot if user is not logged in (temporarily allowing admins for testing)
  if (!user) {
    return null;
  }

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-yellow-400 text-black shadow-lg hover:bg-yellow-500 z-50"
          size="sm"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          isMinimized ? 'h-14' : 'h-96'
        } w-80`}>
          <div className="bg-background border border-border rounded-lg shadow-2xl h-full flex flex-col">
            {/* Header */}
            <div className="bg-yellow-400 text-black p-3 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4" />
                <span className="font-medium text-sm">Support Assistant</span>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  onClick={() => setIsMinimized(!isMinimized)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-black hover:bg-black/20"
                >
                  <Minimize2 className="h-3 w-3" />
                </Button>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-black hover:bg-black/20"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Chat interface - only show when not minimized */}
            {!isMinimized && (
              <div className="flex-1 min-h-0">
                <ChatbotInterface />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;