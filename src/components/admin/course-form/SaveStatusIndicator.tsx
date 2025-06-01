
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SaveStatusIndicatorProps {
  status: 'saving' | 'saved' | 'error' | 'idle';
  lastSaved?: Date;
}

const SaveStatusIndicator = ({ status, lastSaved }: SaveStatusIndicatorProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          text: 'Saving...',
          variant: 'secondary' as const,
        };
      case 'saved':
        return {
          icon: <Check className="h-3 w-3" />,
          text: lastSaved ? `Saved at ${lastSaved.toLocaleTimeString()}` : 'All changes saved',
          variant: 'default' as const,
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          text: 'Save failed',
          variant: 'destructive' as const,
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  
  if (!config) return null;

  return (
    <Badge variant={config.variant} className="flex items-center space-x-1">
      {config.icon}
      <span className="text-xs">{config.text}</span>
    </Badge>
  );
};

export default SaveStatusIndicator;
