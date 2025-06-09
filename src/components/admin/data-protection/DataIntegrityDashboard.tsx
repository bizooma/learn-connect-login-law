
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, CheckCircle, RefreshCw, Database } from "lucide-react";
import { useDataProtection } from "@/hooks/useDataProtection";

const DataIntegrityDashboard = () => {
  const { validateAllDataIntegrity, isProcessing } = useDataProtection();
  const [integrityReport, setIntegrityReport] = useState<any>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    // Run initial integrity check
    runIntegrityCheck();
  }, []);

  const runIntegrityCheck = async () => {
    const result = await validateAllDataIntegrity();
    setIntegrityReport(result);
    setLastChecked(new Date());
  };

  const getStatusColor = (isValid: boolean) => {
    return isValid ? "text-green-600" : "text-red-600";
  };

  const getStatusIcon = (isValid: boolean) => {
    return isValid ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Data Integrity Dashboard</span>
            </CardTitle>
            <Button 
              onClick={runIntegrityCheck} 
              disabled={isProcessing}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
              {isProcessing ? 'Checking...' : 'Run Check'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {lastChecked && (
            <div className="mb-4 text-sm text-gray-600">
              Last checked: {lastChecked.toLocaleString()}
            </div>
          )}

          {integrityReport ? (
            <div className="space-y-6">
              {/* Overall Status */}
              <Alert className={integrityReport.isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <div className={getStatusColor(integrityReport.isValid)}>
                  {getStatusIcon(integrityReport.isValid)}
                </div>
                <AlertDescription className={getStatusColor(integrityReport.isValid)}>
                  <strong>
                    {integrityReport.isValid 
                      ? "✅ All data integrity checks passed" 
                      : `🚨 Found ${integrityReport.summary.totalIssues} critical issues`
                    }
                  </strong>
                  {integrityReport.summary.totalWarnings > 0 && (
                    <div className="mt-1 text-yellow-600">
                      ⚠️ {integrityReport.summary.totalWarnings} warnings detected
                    </div>
                  )}
                </AlertDescription>
              </Alert>

              {/* Detailed Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Assignment Integrity */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>Assignment Data</span>
                      <div className={getStatusColor(integrityReport.assignmentResult.isValid)}>
                        {getStatusIcon(integrityReport.assignmentResult.isValid)}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Assignments:</span>
                      <Badge variant="outline">
                        {integrityReport.summary.assignmentSummary.totalAssignments}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Issues:</span>
                      <Badge variant={integrityReport.assignmentResult.issues.length > 0 ? "destructive" : "secondary"}>
                        {integrityReport.assignmentResult.issues.length}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Warnings:</span>
                      <Badge variant={integrityReport.assignmentResult.warnings.length > 0 ? "default" : "secondary"}>
                        {integrityReport.assignmentResult.warnings.length}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Progress Integrity */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>Progress Data</span>
                      <div className={getStatusColor(integrityReport.progressResult.isValid)}>
                        {getStatusIcon(integrityReport.progressResult.isValid)}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Course Progress:</span>
                      <Badge variant="outline">
                        {integrityReport.summary.progressSummary.totalCourseProgress}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Issues:</span>
                      <Badge variant={integrityReport.progressResult.issues.length > 0 ? "destructive" : "secondary"}>
                        {integrityReport.progressResult.issues.length}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Warnings:</span>
                      <Badge variant={integrityReport.progressResult.warnings.length > 0 ? "default" : "secondary"}>
                        {integrityReport.progressResult.warnings.length}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* System Health */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>System Health</span>
                      <Database className="h-4 w-4" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Certificates:</span>
                      <Badge variant="outline">
                        {integrityReport.summary.progressSummary.totalCertificates}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Unit Progress:</span>
                      <Badge variant="outline">
                        {integrityReport.summary.progressSummary.totalUnitProgress}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Progress:</span>
                      <Badge variant="outline">
                        {integrityReport.summary.assignmentSummary.totalProgress}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Issues Details */}
              {(integrityReport.assignmentResult.issues.length > 0 || 
                integrityReport.progressResult.issues.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Critical Issues Found
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {integrityReport.assignmentResult.issues.map((issue: string, index: number) => (
                        <Alert key={`assignment-${index}`} className="border-red-200 bg-red-50">
                          <AlertDescription className="text-red-800">
                            <strong>Assignment Data:</strong> {issue}
                          </AlertDescription>
                        </Alert>
                      ))}
                      {integrityReport.progressResult.issues.map((issue: string, index: number) => (
                        <Alert key={`progress-${index}`} className="border-red-200 bg-red-50">
                          <AlertDescription className="text-red-800">
                            <strong>Progress Data:</strong> {issue}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Warnings Details */}
              {(integrityReport.assignmentResult.warnings.length > 0 || 
                integrityReport.progressResult.warnings.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-yellow-600 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Warnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {integrityReport.assignmentResult.warnings.map((warning: string, index: number) => (
                        <div key={`assignment-warning-${index}`} className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                          <strong>Assignment Data:</strong> {warning}
                        </div>
                      ))}
                      {integrityReport.progressResult.warnings.map((warning: string, index: number) => (
                        <div key={`progress-warning-${index}`} className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                          <strong>Progress Data:</strong> {warning}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Run an integrity check to see the status of your data</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataIntegrityDashboard;
