import React, { useState } from 'react';
import { X, Minimize2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';
import ChatbotInterface from './ChatbotInterface';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { isAdmin } = useUserRole();
  const { user } = useAuth();
  const location = useLocation();

  // Define dashboard routes where chatbot should be shown
  const dashboardRoutes = [
    '/index',
    '/dashboard',
    '/courses',
    '/course/',
    '/section/',
    '/knowledge-base',
    '/admin-knowledge-base',
    '/lms-tree',
    '/flowchart-lms-tree',
    '/protected-flowchart-lms-tree',
    '/owner-dashboard',
    '/team-leader-dashboard',
    '/student-dashboard',
    '/client-dashboard',
    '/free-dashboard',
    '/admin-dashboard',
    '/admin'
  ];

  // Check if current route is a dashboard page
  const isDashboardPage = dashboardRoutes.some(route => 
    location.pathname === route || location.pathname.startsWith(route)
  );

  // Don't show chatbot if user is not logged in or not on a dashboard page
  if (!user || !isDashboardPage) {
    return null;
  }

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-24 w-24 rounded-full bg-yellow-400 text-black shadow-lg hover:bg-yellow-500 z-50"
          size="sm"
        >
          <MessageCircle className="h-12 w-12" />
        </Button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          isMinimized ? 'h-28' : 'h-[48rem]'
        } w-[40rem]`}>
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