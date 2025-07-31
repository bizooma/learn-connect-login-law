import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle, RefreshCw, Activity, Users, Database } from "lucide-react";

interface AnalysisResult {
  total_passed_quizzes: number;
  missing_completion_records: number;
  affected_users: number;
  affected_courses: number;
  sample_affected_users: any;
}

interface RecoveryResult {
  users_affected: number;
  records_created: number;
  courses_updated: number;
  details: any;
}

export const QuizCompletionRecovery = () => {
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [recovery, setRecovery] = useState<RecoveryResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.rpc('analyze_missing_quiz_completions');
      
      if (error) {
        toast({
          title: "Analysis Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data && data.length > 0) {
        setAnalysis(data[0]);
        toast({
          title: "Analysis Complete",
          description: `Found ${data[0].missing_completion_records} missing completion records affecting ${data[0].affected_users} users`,
          variant: data[0].missing_completion_records > 0 ? "destructive" : "default",
        });
      }
    } catch (error) {
      toast({
        title: "Analysis Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runRecovery = async () => {
    if (!analysis || analysis.missing_completion_records === 0) {
      toast({
        title: "No Recovery Needed",
        description: "Run analysis first or no missing records found",
        variant: "default",
      });
      return;
    }

    setIsRecovering(true);
    try {
      const { data, error } = await supabase.rpc('fix_missing_quiz_completions');
      
      if (error) {
        toast({
          title: "Recovery Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data && data.length > 0) {
        setRecovery(data[0]);
        toast({
          title: "Recovery Complete!",
          description: `Successfully fixed ${data[0].records_created} completion records for ${data[0].users_affected} users`,
          variant: "default",
        });
        
        // Re-run analysis to show updated state
        setTimeout(() => runAnalysis(), 1000);
      }
    } catch (error) {
      toast({
        title: "Recovery Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Quiz Completion Data Recovery (Activity Log)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            This tool identifies and fixes users who passed quizzes but don't have corresponding completion records in the database. Now using historical activity log data.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button 
              onClick={runAnalysis} 
              disabled={isAnalyzing}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isAnalyzing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              {isAnalyzing ? 'Analyzing...' : 'Analyze Data'}
            </Button>
            
            {analysis && analysis.missing_completion_records > 0 && (
              <Button 
                onClick={runRecovery} 
                disabled={isRecovering}
                variant="default"
                className="flex items-center gap-2"
              >
                {isRecovering ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {isRecovering ? 'Recovering...' : 'Fix Missing Records'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{analysis.total_passed_quizzes}</div>
                <div className="text-sm text-blue-800">Total Quiz Passes</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{analysis.missing_completion_records}</div>
                <div className="text-sm text-red-800">Missing Records</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{analysis.affected_users}</div>
                <div className="text-sm text-orange-800">Affected Users</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{analysis.affected_courses}</div>
                <div className="text-sm text-purple-800">Affected Courses</div>
              </div>
            </div>

            {analysis.missing_completion_records > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Data Integrity Issue Detected</span>
                </div>
                <p className="text-sm text-yellow-700">
                  {analysis.missing_completion_records} users who passed quizzes don't have completion records. 
                  This affects their course progress and completion tracking.
                </p>
                
                {analysis.sample_affected_users && Array.isArray(analysis.sample_affected_users) && analysis.sample_affected_users.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-yellow-800 mb-2">Sample affected users:</p>
                    <div className="flex flex-wrap gap-1">
                      {analysis.sample_affected_users.slice(0, 5).map((email: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {email}
                        </Badge>
                      ))}
                      {analysis.sample_affected_users.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{analysis.sample_affected_users.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {analysis.missing_completion_records === 0 && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Data Integrity: Good</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  All quiz completion records are properly synchronized.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {recovery && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Recovery Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{recovery.users_affected}</div>
                <div className="text-sm text-green-800">Users Fixed</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{recovery.records_created}</div>
                <div className="text-sm text-blue-800">Records Created</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{recovery.courses_updated}</div>
                <div className="text-sm text-purple-800">Progress Updated</div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Recovery Successful</span>
              </div>
              <p className="text-sm text-green-700">
                All missing quiz completion records have been restored and course progress has been recalculated.
              </p>
              <p className="text-xs text-green-600 mt-2">
                Audit ID: {recovery.details?.audit_id || 'N/A'}
              </p>
            </div>

            {recovery.details?.affected_users && Array.isArray(recovery.details.affected_users) && recovery.details.affected_users.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">
                  <Users className="h-4 w-4 inline mr-1" />
                  Recovered Users ({recovery.details.affected_users.length}):
                </p>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                  {recovery.details.affected_users.map((email: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {email}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};