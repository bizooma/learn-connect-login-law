import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Activity, Zap, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import { usePerformanceTracking } from '@/hooks/usePerformanceTracking';
import { optimizationTracker } from '@/utils/algorithmicOptimizationTracker';

const PerformanceMonitoring: React.FC = () => {
  const { getMetrics, getOptimizationReport } = usePerformanceTracking();
  const [metrics, setMetrics] = useState<any>(null);
  const [optimizationReport, setOptimizationReport] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(getMetrics());
      setOptimizationReport(getOptimizationReport());
    };

    updateMetrics();
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(updateMetrics, 15000);
    return () => clearInterval(interval);
  }, [getMetrics, getOptimizationReport, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const formatTime = (ms: number) => {
    if (ms < 1) return `${Math.round(ms * 1000)}μs`;
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${Math.round(ms / 1000)}s`;
  };

  const getPerformanceStatus = (renderTime: number) => {
    if (renderTime < 8) return { status: 'excellent', color: 'bg-green-500', icon: CheckCircle };
    if (renderTime < 16) return { status: 'good', color: 'bg-blue-500', icon: CheckCircle };
    if (renderTime < 32) return { status: 'fair', color: 'bg-yellow-500', icon: AlertTriangle };
    return { status: 'poor', color: 'bg-red-500', icon: AlertTriangle };
  };

  if (!metrics) {
    return <div className="p-4">Loading performance metrics...</div>;
  }

  const performanceStatus = getPerformanceStatus(metrics.renderTime);
  const StatusIcon = performanceStatus.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Monitoring</h2>
          <p className="text-gray-600 mt-1">
            Real-time component and application performance metrics
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Current Performance Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Render Performance</CardTitle>
            <StatusIcon className={`h-4 w-4 ${performanceStatus.status === 'excellent' || performanceStatus.status === 'good' ? 'text-green-600' : 'text-orange-600'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(metrics.renderTime)}
            </div>
            <p className="text-xs text-muted-foreground">
              Current render time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(metrics.memoryUsage / 1024 / 1024)}MB
            </div>
            <p className="text-xs text-muted-foreground">
              JavaScript heap size
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Components</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.componentCount}
            </div>
            <p className="text-xs text-muted-foreference">
              Active components
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optimizations</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {optimizationReport?.totalOptimizations || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Applied today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Recent Optimizations
            </CardTitle>
            <CardDescription>
              Performance improvements tracked in the last hour
            </CardDescription>
          </CardHeader>
          <CardContent>
            {optimizationReport?.recentOptimizations?.length > 0 ? (
              <div className="space-y-3">
                {optimizationReport.recentOptimizations.slice(0, 5).map((opt: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{opt.operation}</div>
                      <div className="text-xs text-gray-500">{opt.category}</div>
                    </div>
                    <Badge variant="secondary">
                      {formatTime(opt.timeSaved)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No recent optimizations detected
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Summary
            </CardTitle>
            <CardDescription>
              Overall application performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Cache Hit Rate</span>
                <Badge variant="outline">
                  {metrics.optimizationStats?.cacheHitRate || 0}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Query Optimizations</span>
                <Badge variant="outline">
                  {optimizationReport?.databaseOptimizations || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Memory Optimizations</span>
                <Badge variant="outline">
                  {optimizationReport?.memoryOptimizations || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Parallel Processing</span>
                <Badge variant="outline">
                  {optimizationReport?.parallelOptimizations || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Phase 3 Implementation Status */}
      <Card>
        <CardHeader>
          <CardTitle>Phase 3: Performance Monitoring Implementation</CardTitle>
          <CardDescription>
            Real-time performance tracking and component-level optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="default">✓ Complete</Badge>
              <span className="text-sm">Real-time performance metrics collection</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">✓ Complete</Badge>
              <span className="text-sm">Component-level render performance tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">✓ Complete</Badge>
              <span className="text-sm">Memory usage monitoring and optimization detection</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">✓ Complete</Badge>
              <span className="text-sm">Automated performance recommendations</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">✓ Complete</Badge>
              <span className="text-sm">Performance grading system for components</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Recommendations */}
      {optimizationReport?.recommendations?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Performance Recommendations
            </CardTitle>
            <CardDescription>
              Suggested optimizations based on current metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {optimizationReport.recommendations.map((rec: string, index: number) => (
                <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerformanceMonitoring;