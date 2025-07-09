import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import TicketSubmissionForm from './TicketSubmissionForm';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

const ChatbotInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { role } = useUserRole();
  const { toast } = useToast();

  // Initial welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      type: 'bot',
      content: `Hi! I'm your support assistant. I can help you with questions about using the platform, or you can submit a support ticket for more complex issues. How can I help you today?`,
      timestamp: new Date(),
      suggestions: [
        "How do I access my courses?",
        "How do I download certificates?",
        "How do I update my profile?",
        "Submit a support ticket"
      ]
    };
    setMessages([welcomeMessage]);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      if (content.toLowerCase().includes('support ticket') || content.toLowerCase().includes('submit ticket')) {
        setShowTicketForm(true);
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: "I'll help you submit a support ticket. Please fill out the form below and our team will get back to you within 24-48 hours.",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botResponse]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('chatbot-response', {
        body: {
          question: content,
          userRole: role,
          userId: user.id
        }
      });

      if (error) throw error;

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.response,
        timestamp: new Date(),
        suggestions: data.suggestions
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error getting chatbot response:', error);
      toast({
        title: "Error",
        description: "Sorry, I'm having trouble right now. Please try again or submit a support ticket.",
        variant: "destructive"
      });

      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "I'm sorry, I'm having trouble right now. Please try again or submit a support ticket for immediate assistance.",
        timestamp: new Date(),
        suggestions: ["Submit a support ticket"]
      };

      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const handleTicketSubmitted = () => {
    setShowTicketForm(false);
    const confirmationMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: "Your support ticket has been submitted successfully! Our team will get back to you via email within 24-48 hours. Is there anything else I can help you with?",
      timestamp: new Date(),
      suggestions: [
        "How do I access my courses?",
        "How do I download certificates?",
        "How do I track my progress?"
      ]
    };
    setMessages(prev => [...prev, confirmationMessage]);
  };

  if (showTicketForm) {
    return (
      <TicketSubmissionForm
        onClose={() => setShowTicketForm(false)}
        onSubmitted={handleTicketSubmitted}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start space-x-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                message.type === 'user' ? 'bg-primary' : 'bg-muted'
              }`}>
                {message.type === 'user' ? (
                  <User className="w-3 h-3 text-primary-foreground" />
                ) : (
                  <img src="/lovable-uploads/dd78c305-4498-44b3-89e6-a7b4e959a273.png" alt="Support" className="w-6 h-6 rounded-full object-cover" />
                )}
              </div>
              <div className={`rounded-lg p-3 ${
                message.type === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Quick suggestions */}
        {messages.length > 0 && messages[messages.length - 1].suggestions && (
          <div className="flex flex-wrap gap-2">
            {messages[messages.length - 1].suggestions!.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-xs"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                <img src="/lovable-uploads/dd78c305-4498-44b3-89e6-a7b4e959a273.png" alt="Support" className="w-6 h-6 rounded-full object-cover" />
              </div>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your question..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={() => handleSendMessage(inputValue)}
            disabled={isLoading || !inputValue.trim()}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setShowTicketForm(true)}
            variant="outline"
            size="sm"
            title="Submit Support Ticket"
          >
            <FileText className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotInterface;