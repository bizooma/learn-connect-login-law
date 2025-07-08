
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Flame, Target, Users, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import StreakLeaderboard, { StreakLeaderboardRef } from "@/components/leaderboards/StreakLeaderboard";
import CategoryLeaderboard, { CategoryLeaderboardRef } from "@/components/leaderboards/CategoryLeaderboard";
import { useLeaderboards } from "@/hooks/useLeaderboards";
import { supabase } from "@/integrations/supabase/client";

const Leaderboards = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [cacheStatus, setCacheStatus] = useState<'checking' | 'empty' | 'populated'>('checking');
  const streakRef = useRef<StreakLeaderboardRef>(null);
  const salesRef = useRef<CategoryLeaderboardRef>(null);
  const legalRef = useRef<CategoryLeaderboardRef>(null);
  const { refreshCache } = useLeaderboards();

  const handleRefreshCache = async () => {
    try {
      setIsRefreshing(true);
      setDebugInfo(null);
      console.log('Starting leaderboard refresh...');
      
      const result = await refreshCache();
      
      console.log('Refresh result:', result);
      setDebugInfo(result);
      
      // Trigger refresh on all components
      streakRef.current?.refresh();
      salesRef.current?.refresh();
      legalRef.current?.refresh();
      
      setCacheStatus('populated');
    } catch (error: any) {
      console.error('Error refreshing leaderboard cache:', error);
      setDebugInfo({ error: error.message });
    } finally {
      setIsRefreshing(false);
    }
  };

  const checkCacheStatus = async () => {
    try {
      const { count, error } = await supabase
        .from('leaderboard_cache')
        .select('*', { count: 'exact', head: true })
        .gt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Error checking cache status:', error);
        setCacheStatus('empty');
        return;
      }

      setCacheStatus(count && count > 0 ? 'populated' : 'empty');
      
      if (count === 0) {
        console.log('No valid cache data found, auto-refreshing...');
        await handleRefreshCache();
      }
    } catch (error) {
      console.error('Error checking cache status:', error);
      setCacheStatus('empty');
    }
  };

  // Auto-refresh on page load if no data exists
  useEffect(() => {
    checkCacheStatus();
  }, []);

  const getCacheStatusIcon = () => {
    switch (cacheStatus) {
      case 'checking':
        return <RefreshCw className="h-3 w-3 animate-spin" />;
      case 'populated':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'empty':
        return <AlertCircle className="h-3 w-3 text-orange-600" />;
    }
  };

  const getCacheStatusText = () => {
    switch (cacheStatus) {
      case 'checking':
        return 'Checking cache...';
      case 'populated':
        return `Cache active (${debugInfo?.total_cache_entries || 'unknown'} entries)`;
      case 'empty':
        return 'Cache empty - click refresh';
    }
  };

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
          <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded">
            <div className="flex items-center gap-1">
              {getCacheStatusIcon()}
              <span>{getCacheStatusText()}</span>
            </div>
          </div>
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
              <StreakLeaderboard ref={streakRef} />
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
              <CategoryLeaderboard category="Sales" ref={salesRef} />
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
              <CategoryLeaderboard category="Legal" ref={legalRef} />
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
