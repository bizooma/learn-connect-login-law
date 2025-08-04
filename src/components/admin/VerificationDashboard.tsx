import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useVerificationMonitor } from "@/hooks/useVerificationMonitor";
import { AlertCircle, CheckCircle, TrendingUp, RefreshCw } from "lucide-react";

const VerificationDashboard = () => {
  const { metrics, generateVerificationReport, lastVerification } = useVerificationMonitor();

  const handleGenerateReport = () => {
    const report = generateVerificationReport();
    console.log('Generated Verification Report:', report);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'good':
        return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'excellent' ? 'default' : 
                   status === 'good' ? 'secondary' : 'destructive';
    return <Badge variant={variant}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">System Verification Dashboard</h1>
        <div className="flex items-center gap-4">
          {lastVerification && (
            <span className="text-sm text-muted-foreground">
              Last check: {lastVerification.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={handleGenerateReport} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Video Playback */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📹 Video Playback
              {getStatusIcon(
                metrics.videoPlayback.crashCount === 0 ? 'excellent' : 
                metrics.videoPlayback.completionRate > 0.8 ? 'good' : 'needs_attention'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Sessions:</span>
                <span className="font-medium">{metrics.videoPlayback.sessionCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Crashes:</span>
                <span className="font-medium text-red-500">{metrics.videoPlayback.crashCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Completion Rate:</span>
                <span className="font-medium">
                  {(metrics.videoPlayback.completionRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Avg Watch Time:</span>
                <span className="font-medium">{metrics.videoPlayback.avgWatchTime.toFixed(1)}s</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Saving */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💾 Progress Saving
              {getStatusIcon(
                metrics.progressSaving.failureCount === 0 ? 'excellent' : 
                (metrics.progressSaving.successCount / metrics.progressSaving.attemptCount) > 0.9 ? 'good' : 'needs_attention'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Attempts:</span>
                <span className="font-medium">{metrics.progressSaving.attemptCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Successes:</span>
                <span className="font-medium text-green-500">{metrics.progressSaving.successCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Failures:</span>
                <span className="font-medium text-red-500">{metrics.progressSaving.failureCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Success Rate:</span>
                <span className="font-medium">
                  {metrics.progressSaving.attemptCount > 0 ? 
                    ((metrics.progressSaving.successCount / metrics.progressSaving.attemptCount) * 100).toFixed(1) : 100}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quiz Completion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎯 Quiz Completion
              {getStatusIcon(
                (metrics.quizCompletion.submissionFailures + metrics.quizCompletion.loadingFailures) === 0 ? 'excellent' : 
                (metrics.quizCompletion.successCount / metrics.quizCompletion.attemptCount) > 0.9 ? 'good' : 'needs_attention'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Attempts:</span>
                <span className="font-medium">{metrics.quizCompletion.attemptCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Successes:</span>
                <span className="font-medium text-green-500">{metrics.quizCompletion.successCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Submission Fails:</span>
                <span className="font-medium text-red-500">{metrics.quizCompletion.submissionFailures}</span>
              </div>
              <div className="flex justify-between">
                <span>Loading Fails:</span>
                <span className="font-medium text-red-500">{metrics.quizCompletion.loadingFailures}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔐 Authentication
              {getStatusIcon(
                metrics.authentication.loginFailures === 0 ? 'excellent' : 
                ((metrics.authentication.loginAttempts - metrics.authentication.loginFailures) / metrics.authentication.loginAttempts) > 0.9 ? 'good' : 'needs_attention'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Login Attempts:</span>
                <span className="font-medium">{metrics.authentication.loginAttempts}</span>
              </div>
              <div className="flex justify-between">
                <span>Login Failures:</span>
                <span className="font-medium text-red-500">{metrics.authentication.loginFailures}</span>
              </div>
              <div className="flex justify-between">
                <span>Session Dropouts:</span>
                <span className="font-medium text-yellow-500">{metrics.authentication.sessionDropouts}</span>
              </div>
              <div className="flex justify-between">
                <span>Success Rate:</span>
                <span className="font-medium">
                  {metrics.authentication.loginAttempts > 0 ? 
                    (((metrics.authentication.loginAttempts - metrics.authentication.loginFailures) / metrics.authentication.loginAttempts) * 100).toFixed(1) : 100}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Browser Stability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🖥️ Browser Stability
              {getStatusIcon(
                metrics.browserStability.crashEvents === 0 && metrics.browserStability.memoryWarnings < 3 ? 'excellent' :
                metrics.browserStability.crashEvents < 2 && metrics.browserStability.memoryWarnings < 5 ? 'good' : 'needs_attention'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Memory Warnings:</span>
                <span className="font-medium text-yellow-500">{metrics.browserStability.memoryWarnings}</span>
              </div>
              <div className="flex justify-between">
                <span>Crash Events:</span>
                <span className="font-medium text-red-500">{metrics.browserStability.crashEvents}</span>
              </div>
              <div className="flex justify-between">
                <span>Freeze Events:</span>
                <span className="font-medium text-orange-500">{metrics.browserStability.freezeEvents}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerificationDashboard;