import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useCacheManager = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const refreshLeaderboardCache = useCallback(async (): Promise<boolean> => {
    try {
      setIsRefreshing(true);
      
      // Call the refresh_leaderboard_cache function
      const { error } = await supabase.rpc('refresh_leaderboard_cache');
      
      if (error) {
        console.error('Error refreshing leaderboard cache:', error);
        toast({
          title: "Cache Refresh Failed",
          description: "Failed to refresh leaderboard data.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Cache Refreshed",
        description: "Leaderboard data has been updated.",
      });
      
      return true;
    } catch (error) {
      console.error('Error refreshing cache:', error);
      toast({
        title: "Cache Refresh Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [toast]);

  const checkCacheHealth = useCallback(async (): Promise<{
    isEmpty: boolean;
    hasExpiredEntries: boolean;
    totalEntries: number;
  }> => {
    try {
      const now = new Date().toISOString();
      
      // Check total entries
      const { count: totalEntries } = await supabase
        .from('leaderboard_cache')
        .select('*', { count: 'exact' });

      // Check for expired entries
      const { count: expiredEntries } = await supabase
        .from('leaderboard_cache')
        .select('*', { count: 'exact' })
        .lt('expires_at', now);

      return {
        isEmpty: (totalEntries || 0) === 0,
        hasExpiredEntries: (expiredEntries || 0) > 0,
        totalEntries: totalEntries || 0,
      };
    } catch (error) {
      console.error('Error checking cache health:', error);
      return {
        isEmpty: true,
        hasExpiredEntries: false,
        totalEntries: 0,
      };
    }
  }, []);

  const autoRefreshIfNeeded = useCallback(async (): Promise<boolean> => {
    const health = await checkCacheHealth();
    
    if (health.isEmpty || health.hasExpiredEntries) {
      console.log('Cache needs refresh:', health);
      return await refreshLeaderboardCache();
    }
    
    return true;
  }, [checkCacheHealth, refreshLeaderboardCache]);

  return {
    isRefreshing,
    refreshLeaderboardCache,
    checkCacheHealth,
    autoRefreshIfNeeded,
  };
};