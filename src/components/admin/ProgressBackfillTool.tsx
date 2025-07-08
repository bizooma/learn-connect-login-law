
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useProgressBackfill } from "@/hooks/useProgressBackfill";
import { logger } from "@/utils/logger";

const ProgressBackfillTool = () => {
  const { backfillMissingUnitCompletions, fixVideoCompletionIssues, processing } = useProgressBackfill();
  const [results, setResults] = useState<any>(null);
  const [videoResults, setVideoResults] = useState<any>(null);

  const handleBackfill = async () => {
    try {
      const result = await backfillMissingUnitCompletions();
      setResults(result);
    } catch (error) {
      logger.error('Backfill failed:', error);
    }
  };

  const handleVideoFix = async () => {
    try {
      const result = await fixVideoCompletionIssues();
      setVideoResults(result);
    } catch (error) {
      logger.error('Video fix failed:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>Progress Backfill Tool</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This tool will find users who have completed quizzes but their units still show as incomplete, 
            and fix their progress records. This is safe and will not remove any existing progress.
          </AlertDescription>
        </Alert>

        <div className="flex items-center space-x-4">
          <Button 
            onClick={handleBackfill} 
            disabled={processing}
            className="flex items-center space-x-2"
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <span>{processing ? 'Processing...' : 'Fix Unit Completions'}</span>
          </Button>
          
          <Button 
            onClick={handleVideoFix} 
            disabled={processing}
            variant="outline"
            className="flex items-center space-x-2"
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <span>{processing ? 'Processing...' : 'Fix Video Completions'}</span>
          </Button>
        </div>

        {results && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p><strong>Unit Completion Results:</strong></p>
                <p>• Total units processed: {results.totalProcessed}</p>
                <p>• Units fixed: {results.backfilledCount}</p>
                {results.errors.length > 0 && (
                  <p>• Errors: {results.errors.length}</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {videoResults && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p><strong>Video Completion Results:</strong></p>
                <p>• Total videos processed: {videoResults.totalProcessed}</p>
                <p>• Videos fixed: {videoResults.fixedCount}</p>
                {videoResults.errors.length > 0 && (
                  <p>• Errors: {videoResults.errors.length}</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgressBackfillTool;
