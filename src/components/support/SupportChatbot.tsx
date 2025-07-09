import { useState } from 'react';
import { MessageCircle, X, Send, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSupportChat } from '@/hooks/useSupportChat';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { ChatMessage } from './ChatMessage';
import { TicketForm } from './TicketForm';

export const SupportChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [showTicketForm, setShowTicketForm] = useState(false);
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { messages, sendMessage, isLoading } = useSupportChat();

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    await sendMessage(message, isAdmin ? 'admin' : 'student');
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setShowTicketForm(false);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={toggleChat}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all duration-300 bg-blue-600 hover:bg-blue-700"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[500px] shadow-2xl">
      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between py-3 bg-blue-600 text-white rounded-t-lg">
          <CardTitle className="text-lg font-semibold">Support Assistant</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleChat}
            className="text-white hover:bg-blue-700 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 p-0 flex flex-col">
          {showTicketForm ? (
            <div className="flex-1 p-4">
              <TicketForm 
                onSuccess={() => {
                  setShowTicketForm(false);
                  setIsOpen(false);
                }}
                onCancel={() => setShowTicketForm(false)}
              />
            </div>
          ) : (
            <>
              <div 
                className="flex-1 overflow-y-auto p-4 max-h-[350px]"
                onWheel={(e) => e.stopPropagation()}
                style={{ scrollbarWidth: 'thin' }}
              >
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm mb-2">👋 Hi! I'm your support assistant.</p>
                    <p className="text-xs">Ask me anything about using the platform!</p>
                  </div>
                )}
                {messages.map((msg, index) => (
                  <ChatMessage key={index} message={msg} />
                ))}
                {isLoading && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-muted rounded-lg px-3 py-2 max-w-[80%]">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTicketForm(true)}
                    className="text-xs"
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Submit Ticket
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !message.trim()}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};