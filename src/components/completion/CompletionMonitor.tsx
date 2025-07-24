import { useEffect, useState } from "react";
import { useEnhancedCompletion } from "@/hooks/useEnhancedCompletion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, RefreshCw, X, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CompletionMonitorProps {
  className?: string;
}

const CompletionMonitor = ({ className }: CompletionMonitorProps) => {
  const { 
    hasFailures, 
    failureQueue, 
    retryFailedCompletions, 
    clearFailureQueue,
    processing 
  } = useEnhancedCompletion();
  const { toast } = useToast();
  const [isRetrying, setIsRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Auto-retry failed completions when component mounts
  useEffect(() => {
    if (hasFailures && !processing) {
      const timer = setTimeout(() => {
        retryFailedCompletions();
      }, 2000); // Wait 2 seconds before auto-retry

      return () => clearTimeout(timer);
    }
  }, [hasFailures, processing, retryFailedCompletions]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await retryFailedCompletions();
      toast({
        title: "Retry Initiated",
        description: "Attempting to save your pending completions...",
      });
    } catch (error) {
      toast({
        title: "Retry Failed",
        description: "Unable to retry completions. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const handleClearQueue = () => {
    clearFailureQueue();
    toast({
      title: "Queue Cleared",
      description: "All pending completions have been cleared.",
    });
  };

  if (!hasFailures) return null;

  return (
    <div className={className}>
      <Card className="border-warning bg-warning/5">
        <CardContent className="p-4">
          <Alert className="border-warning/50">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertTitle className="text-warning-foreground">
              Completion Save Issues Detected
            </AlertTitle>
            <AlertDescription className="text-warning-foreground/80">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span>
                      {failureQueue} completion{failureQueue !== 1 ? 's' : ''} pending save
                    </span>
                    <Badge variant="outline" className="border-warning text-warning">
                      {failureQueue}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDetails(!showDetails)}
                      className="border-warning/50 text-warning hover:bg-warning/10"
                    >
                      {showDetails ? 'Hide' : 'Show'} Details
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      disabled={isRetrying || processing}
                      className="border-warning/50 text-warning hover:bg-warning/10"
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
                      {isRetrying ? 'Retrying...' : 'Retry Now'}
                    </Button>
                  </div>
                </div>

                {showDetails && (
                  <div className="mt-3 p-3 bg-background/50 rounded-md border">
                    <div className="text-sm space-y-2">
                      <div className="font-medium">What's happening?</div>
                      <div className="text-muted-foreground">
                        Some of your course progress couldn't be saved automatically. 
                        This can happen due to network issues or temporary server problems.
                      </div>
                      
                      <div className="font-medium mt-3">What we're doing:</div>
                      <ul className="text-muted-foreground list-disc list-inside space-y-1">
                        <li>Automatically retrying failed saves in the background</li>
                        <li>Keeping your progress safe in local storage</li>
                        <li>You can continue learning - nothing is lost</li>
                      </ul>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t">
                        <div className="text-xs text-muted-foreground">
                          Your progress is protected and will be restored automatically
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearQueue}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Clear All
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-xs text-warning-foreground/60 mt-2">
                  💡 You can continue learning normally. Your progress will be saved automatically when possible.
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompletionMonitor;