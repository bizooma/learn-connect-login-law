import { format } from 'date-fns';
import { User, Bot } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === 'user';
  const timestamp = new Date(message.timestamp);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start gap-2 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-600' : 'bg-gray-200'
        }`}>
          {isUser ? (
            <User className="h-4 w-4 text-white" />
          ) : (
            <Bot className="h-4 w-4 text-gray-600" />
          )}
        </div>
        
        <div className={`rounded-lg px-3 py-2 ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-muted text-foreground'
        }`}>
          <div className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </div>
          <div className={`text-xs mt-1 opacity-70 ${
            isUser ? 'text-blue-100' : 'text-muted-foreground'
          }`}>
            {format(timestamp, 'HH:mm')}
          </div>
        </div>
      </div>
    </div>
  );
};