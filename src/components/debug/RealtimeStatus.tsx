import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';

interface ConnectionInfo {
  id: string;
  status: string;
  error?: string;
  isConnected: boolean;
}

interface RealtimeStatusProps {
  connections: ConnectionInfo[];
  className?: string;
}

export const RealtimeStatus = ({ connections, className }: RealtimeStatusProps) => {
  const [isVisible, setIsVisible] = useState(false);

  if (!isVisible) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsVisible(true)}
        className={`fixed bottom-4 right-4 z-50 opacity-50 hover:opacity-100 ${className}`}
      >
        <Eye className="h-4 w-4" />
        Debug
      </Button>
    );
  }

  const allConnected = connections.every(conn => conn.isConnected);

  return (
    <Card className={`fixed bottom-4 right-4 w-80 z-50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {allConnected ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            Realtime Status
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {connections.map((conn) => (
          <div key={conn.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              {conn.isConnected ? (
                <Wifi className="h-3 w-3 text-green-500" />
              ) : (
                <WifiOff className="h-3 w-3 text-red-500" />
              )}
              <span className="text-xs font-medium truncate">{conn.id}</span>
            </div>
            <Badge 
              variant={conn.isConnected ? "default" : "destructive"}
              className="text-xs"
            >
              {conn.status}
            </Badge>
          </div>
        ))}
        {connections.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            No active connections
          </p>
        )}
      </CardContent>
    </Card>
  );
};