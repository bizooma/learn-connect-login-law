
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, TrendingUp, Database, AlertTriangle } from "lucide-react";
import { useDataProtection } from "@/hooks/useDataProtection";
import ProgressIntegrityDashboard from "./progress-management/ProgressIntegrityDashboard";

const DataProtection = () => {
  const [activeOperation, setActiveOperation] = useState(null);
  const { 
    isProcessing, 
    validateAllDataIntegrity, 
    protectedProgressRecalculation,
    protectedProgressDiagnosis 
  } = useDataProtection();

  const handleDataIntegrityCheck = async () => {
    setActiveOperation('integrity');
    await validateAllDataIntegrity();
    setActiveOperation(null);
  };

  const handleProgressRecalculation = async () => {
    setActiveOperation('recalculation');
    await protectedProgressRecalculation('Manual progress recalculation from Data Protection tab');
    setActiveOperation(null);
  };

  const handleProgressDiagnosis = async () => {
    setActiveOperation('diagnosis');
    await protectedProgressDiagnosis();
    setActiveOperation(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Data Protection & Integrity
          </CardTitle>
          <CardDescription>
            Monitor data integrity, run diagnostics, and maintain system consistency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard">Integrity Dashboard</TabsTrigger>
              <TabsTrigger value="diagnostics">Quick Diagnostics</TabsTrigger>
              <TabsTrigger value="tools">Data Tools</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-4">
              <ProgressIntegrityDashboard />
            </TabsContent>

            <TabsContent value="diagnostics" className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Run these diagnostics to check system health and identify potential issues.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">System Integrity</CardTitle>
                    <CardDescription>
                      Check overall data consistency across all modules
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={handleDataIntegrityCheck}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      <Database className={`h-4 w-4 mr-2 ${activeOperation === 'integrity' ? 'animate-spin' : ''}`} />
                      {activeOperation === 'integrity' ? 'Checking...' : 'Run Full Check'}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Progress Diagnosis</CardTitle>
                    <CardDescription>
                      Check for progress calculation inconsistencies
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={handleProgressDiagnosis}
                      disabled={isProcessing}
                      className="w-full"
                      variant="outline"
                    >
                      <TrendingUp className={`h-4 w-4 mr-2 ${activeOperation === 'diagnosis' ? 'animate-spin' : ''}`} />
                      {activeOperation === 'diagnosis' ? 'Diagnosing...' : 'Diagnose Progress'}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Fix Inconsistencies</CardTitle>
                    <CardDescription>
                      Recalculate progress while preserving manual work
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={handleProgressRecalculation}
                      disabled={isProcessing}
                      className="w-full"
                      variant="destructive"
                    >
                      <ShieldCheck className={`h-4 w-4 mr-2 ${activeOperation === 'recalculation' ? 'animate-spin' : ''}`} />
                      {activeOperation === 'recalculation' ? 'Fixing...' : 'Fix Progress'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tools" className="space-y-4">
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription>
                  Advanced data protection tools will be available here. These include backup management,
                  data retention policies, and compliance reporting features.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>Coming Soon</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Additional data protection features are in development, including:
                  </p>
                  <ul className="mt-2 list-disc list-inside text-gray-600 space-y-1">
                    <li>Automated backup management</li>
                    <li>Data retention policy enforcement</li>
                    <li>GDPR compliance reporting</li>
                    <li>Advanced audit trail analysis</li>
                    <li>Bulk data operations with safeguards</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataProtection;
