import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Loader2, Database, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ConsistencyIssue {
  userId: string;
  email: string;
  issue: string;
  severity: 'high' | 'medium' | 'low';
  autoFixable: boolean;
}

const UserDataConsistencyChecker = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [issues, setIssues] = useState<ConsistencyIssue[]>([]);
  const [checkedUsers, setCheckedUsers] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const { toast } = useToast();

  const runConsistencyCheck = async () => {
    setLoading(true);
    setProgress(0);
    setIssues([]);
    setCheckedUsers(0);

    try {
      // Get all users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, is_deleted')
        .eq('is_deleted', false);

      if (usersError) throw usersError;

      setTotalUsers(users?.length || 0);

      const foundIssues: ConsistencyIssue[] = [];

      // Check each user for consistency issues
      for (let i = 0; i < (users?.length || 0); i++) {
        const user = users![i];
        setCheckedUsers(i + 1);
        setProgress(((i + 1) / (users?.length || 1)) * 100);

        // Check for role consistency issues
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        // Check for multiple roles (should only have one)
        if (roles && roles.length > 1) {
          foundIssues.push({
            userId: user.id,
            email: user.email,
            issue: `Has ${roles.length} roles: ${roles.map(r => r.role).join(', ')}`,
            severity: 'high',
            autoFixable: false
          });
        }

        // Check for owners without law firms
        if (roles && roles.some(r => r.role === 'owner')) {
          const { data: lawFirm } = await supabase
            .from('law_firms')
            .select('id')
            .eq('owner_id', user.id)
            .maybeSingle();

          if (!lawFirm) {
            foundIssues.push({
              userId: user.id,
              email: user.email,
              issue: 'Marked as owner but has no law firm',
              severity: 'medium',
              autoFixable: false
            });
          }
        }

        // Check for users without any role
        if (!roles || roles.length === 0) {
          foundIssues.push({
            userId: user.id,
            email: user.email,
            issue: 'Has no assigned role',
            severity: 'high',
            autoFixable: true
          });
        }

        // Check for progress inconsistencies
        const { data: progress } = await supabase
          .from('user_course_progress')
          .select('progress_percentage, status')
          .eq('user_id', user.id);

        if (progress) {
          const invalidProgress = progress.filter(p => 
            p.progress_percentage < 0 || 
            p.progress_percentage > 100 ||
            (p.status === 'completed' && p.progress_percentage < 100) ||
            (p.status === 'not_started' && p.progress_percentage > 0)
          );

          if (invalidProgress.length > 0) {
            foundIssues.push({
              userId: user.id,
              email: user.email,
              issue: `Has ${invalidProgress.length} invalid progress record(s)`,
              severity: 'medium',
              autoFixable: true
            });
          }
        }

        // Small delay to prevent overwhelming the database
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setIssues(foundIssues);
      
      toast({
        title: "Consistency Check Complete",
        description: `Checked ${users?.length || 0} users. Found ${foundIssues.length} issues.`,
        variant: foundIssues.length > 0 ? "destructive" : "default",
      });

    } catch (error) {
      console.error('Error running consistency check:', error);
      toast({
        title: "Check Failed",
        description: error.message || "Failed to run consistency check",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const autoFixIssues = async () => {
    const fixableIssues = issues.filter(issue => issue.autoFixable);
    
    if (fixableIssues.length === 0) {
      toast({
        title: "No Auto-Fixable Issues",
        description: "All remaining issues require manual intervention",
      });
      return;
    }

    setLoading(true);
    let fixedCount = 0;

    try {
      for (const issue of fixableIssues) {
        if (issue.issue.includes('no assigned role')) {
          // Assign default 'student' role
          await supabase
            .from('user_roles')
            .insert({ user_id: issue.userId, role: 'student' });
          fixedCount++;
        }
        
        if (issue.issue.includes('invalid progress record')) {
          // Reset invalid progress to consistent state
          await supabase
            .from('user_course_progress')
            .update({ 
              progress_percentage: 0, 
              status: 'not_started' 
            })
            .eq('user_id', issue.userId)
            .or('progress_percentage.lt.0,progress_percentage.gt.100');
          fixedCount++;
        }
      }

      toast({
        title: "Auto-Fix Complete",
        description: `Fixed ${fixedCount} issues automatically`,
      });

      // Re-run the check to see remaining issues
      await runConsistencyCheck();

    } catch (error) {
      console.error('Error auto-fixing issues:', error);
      toast({
        title: "Auto-Fix Failed",
        description: error.message || "Failed to auto-fix issues",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>User Data Consistency Checker</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Button 
            onClick={runConsistencyCheck}
            disabled={loading}
            className="flex-1"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />}
            Run Full Consistency Check
          </Button>
          
          {issues.length > 0 && (
            <Button 
              onClick={autoFixIssues}
              disabled={loading || issues.filter(i => i.autoFixable).length === 0}
              variant="outline"
            >
              Auto-Fix ({issues.filter(i => i.autoFixable).length})
            </Button>
          )}
        </div>

        {loading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Checking users...</span>
              <span>{checkedUsers} / {totalUsers}</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {issues.length > 0 && !loading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Found {issues.length} Issue(s)</h4>
              <div className="flex space-x-2 text-xs">
                <span className="text-red-600">High: {issues.filter(i => i.severity === 'high').length}</span>
                <span className="text-orange-600">Medium: {issues.filter(i => i.severity === 'medium').length}</span>
                <span className="text-yellow-600">Low: {issues.filter(i => i.severity === 'low').length}</span>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {issues.map((issue, index) => (
                <Alert key={index} className={getSeverityColor(issue.severity)}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{issue.email}</p>
                        <p className="text-sm">{issue.issue}</p>
                      </div>
                      <div className="flex items-center space-x-1 text-xs">
                        <span className="font-medium">{issue.severity.toUpperCase()}</span>
                        {issue.autoFixable && <CheckCircle className="h-3 w-3 text-green-600" />}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {!loading && issues.length === 0 && checkedUsers > 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium">All Clear!</p>
              <p>No data consistency issues found across {checkedUsers} users.</p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default UserDataConsistencyChecker;