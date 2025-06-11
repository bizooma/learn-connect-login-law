
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { progressRecalculationService } from "./services/progressRecalculationService";
import { CheckCircle, AlertTriangle, RefreshCw, TrendingUp, Users, Database } from "lucide-react";

const ProgressIntegrityDashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [integrityData, setIntegrityData] = useState(null);
  const [lastRecalculation, setLastRecalculation] = useState(null);
  const { toast } = useToast();

  const fetchIntegrityData = async () => {
    setIsLoading(true);
    try {
      const data = await progressRecalculationService.getProgressIntegritySummary();
      setIntegrityData(data);
    } catch (error) {
      console.error('Error fetching integrity data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch progress integrity data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecalculation = async () => {
    setIsRecalculating(true);
    try {
      const result = await progressRecalculationService.recalculateProgressRefined(
        'Manual refined progress recalculation from integrity dashboard'
      );

      if (result.success) {
        toast({
          title: "✅ Recalculation Successful",
          description: `Updated ${result.recordsUpdated} records for ${result.usersAffected} users`,
        });
        setLastRecalculation(result);
        // Refresh integrity data
        await fetchIntegrityData();
      } else {
        toast({
          title: "🚨 Recalculation Failed",
          description: result.errors.join(', '),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error during recalculation:', error);
      toast({
        title: "Error",
        description: "Failed to run progress recalculation",
        variant: "destructive",
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  useEffect(() => {
    fetchIntegrityData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getHealthColor = (score) => {
    if (score >= 95) return "text-green-600";
    if (score >= 85) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusBadge = (status) => {
    const variants = {
      'HEALTHY': 'default',
      'NEEDS_ATTENTION': 'destructive',
      'ERROR': 'destructive'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Progress Integrity Dashboard</h2>
          <p className="text-gray-600 mt-1">Monitor and maintain data consistency</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={fetchIntegrityData} 
            variant="outline"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={handleRecalculation}
            disabled={isRecalculating || !integrityData?.inconsistentRecords}
          >
            <TrendingUp className={`h-4 w-4 mr-2 ${isRecalculating ? 'animate-spin' : ''}`} />
            {isRecalculating ? 'Recalculating...' : 'Fix Inconsistencies'}
          </Button>
        </div>
      </div>

      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            {integrityData?.isHealthy ? 
              <CheckCircle className="h-4 w-4 text-green-600" /> : 
              <AlertTriangle className="h-4 w-4 text-red-600" />
            }
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(integrityData?.healthScore || 0)}`}>
              {integrityData?.healthScore?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Data consistency score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress Records</CardTitle>
            <Database className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{integrityData?.totalProgressRecords?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total course progress records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inconsistencies</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {integrityData?.inconsistentRecords || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Records needing attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            System Status
            {getStatusBadge(integrityData?.summary?.status)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{integrityData?.summary?.message}</strong>
                <br />
                <em>Recommended action: {integrityData?.summary?.recommendedAction}</em>
              </AlertDescription>
            </Alert>

            {integrityData?.lastChecked && (
              <p className="text-sm text-gray-500">
                Last checked: {new Date(integrityData.lastChecked).toLocaleString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Recalculation Results */}
      {lastRecalculation && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Recalculation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Records Updated</p>
                <p className="text-xl font-semibold">{lastRecalculation.recordsUpdated}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Users Affected</p>
                <p className="text-xl font-semibold">{lastRecalculation.usersAffected}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Manual Work Preserved</p>
                <p className="text-xl font-semibold">
                  {lastRecalculation.details.preservedManualWork ? '✅ Yes' : '❌ No'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-xl font-semibold text-green-600">
                  {lastRecalculation.success ? 'Success' : 'Failed'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProgressIntegrityDashboard;
