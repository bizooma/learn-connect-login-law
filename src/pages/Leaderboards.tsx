
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Flame, Target, Users, RefreshCw, AlertCircle } from "lucide-react";
import StreakLeaderboard from "@/components/leaderboards/StreakLeaderboard";
import CategoryLeaderboard from "@/components/leaderboards/CategoryLeaderboard";
import { useLeaderboards } from "@/hooks/useLeaderboards";
import { supabase } from "@/integrations/supabase/client";

const Leaderboards = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { refreshCache } = useLeaderboards();

  const handleRefreshCache = async () => {
    try {
      setIsRefreshing(true);
      console.log('Starting leaderboard refresh...');
      
      const result = await refreshCache();
      
      console.log('Refresh result:', result);
      setDebugInfo(result);
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      console.error('Error refreshing leaderboard cache:', error);
      setDebugInfo({ error: error.message });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh on page load if no data exists
  useEffect(() => {
    const checkAndRefresh = async () => {
      const { data, error } = await supabase
        .from('leaderboard_cache')
        .select('count(*)')
        .gt('expires_at', new Date().toISOString())
        .limit(1);
      
      if (!data || data.length === 0) {
        console.log('No valid cache data found, auto-refreshing...');
        handleRefreshCache();
      }
    };
    
    checkAndRefresh();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leaderboards</h1>
          <p className="text-gray-600 mt-2">
            Compete with your peers and track your learning progress
          </p>
        </div>
        <div className="flex items-center gap-3">
          {debugInfo && (
            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded">
              <div className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {debugInfo.error ? (
                  <span className="text-red-600">Error: {debugInfo.error}</span>
                ) : (
                  <span>Debug: {debugInfo?.total_cache_entries || 0} entries</span>
                )}
              </div>
            </div>
          )}
          <button
            onClick={handleRefreshCache}
            disabled={isRefreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Rankings'}
          </button>
        </div>
      </div>

      <Tabs defaultValue="streak" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="streak" className="flex items-center gap-2">
            <Flame className="h-4 w-4" />
            Learning Streak
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Sales Training
          </TabsTrigger>
          <TabsTrigger value="legal" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Legal Training
          </TabsTrigger>
        </TabsList>

        <TabsContent value="streak" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Learning Streak Champions
              </CardTitle>
              <CardDescription>
                Users who have maintained learning streaks (minimum 1 day)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StreakLeaderboard key={refreshKey} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                Sales Training Leaders
              </CardTitle>
              <CardDescription>
                Top performers by completion rate in Sales courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryLeaderboard category="Sales" key={refreshKey} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Legal Training Leaders
              </CardTitle>
              <CardDescription>
                Top performers by completion rate in Legal courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryLeaderboard category="Legal" key={refreshKey} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {debugInfo && (
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-gray-600 overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Leaderboards;
