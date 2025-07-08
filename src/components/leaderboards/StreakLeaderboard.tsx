
import { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LeaderboardCard from "./LeaderboardCard";

interface StreakLeaderboardEntry {
  user_id: string;
  user_name: string;
  user_email: string;
  current_streak: number;
  longest_streak: number;
  rank_position: number;
}

export interface StreakLeaderboardRef {
  refresh: () => void;
}

const StreakLeaderboard = forwardRef<StreakLeaderboardRef, {}>((props, ref) => {
  const [entries, setEntries] = useState<StreakLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStreakLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      
      // First try to get from cache
      const { data: cachedData, error: cacheError } = await supabase
        .from('leaderboard_cache')
        .select('*')
        .eq('leaderboard_type', 'learning_streak')
        .gt('expires_at', new Date().toISOString())
        .order('rank_position', { ascending: true });

      if (cacheError) {
        console.error('Error fetching cached leaderboard:', cacheError);
      }

      if (cachedData && cachedData.length > 0) {
        const formattedData = cachedData.map(entry => ({
          user_id: entry.user_id,
          user_name: entry.user_name,
          user_email: entry.user_email,
          current_streak: (entry.additional_data as any)?.current_streak || entry.score,
          longest_streak: (entry.additional_data as any)?.longest_streak || 0,
          rank_position: entry.rank_position
        }));
        setEntries(formattedData);
      } else {
        // If no cache, generate fresh data
        const { data: freshData, error: freshError } = await supabase
          .rpc('generate_learning_streak_leaderboard', { p_limit: 20 });

        if (freshError) {
          throw freshError;
        }

        setEntries(freshData || []);
      }
    } catch (error) {
      console.error('Error fetching streak leaderboard:', error);
      toast({
        title: "Error",
        description: "Failed to load streak leaderboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useImperativeHandle(ref, () => ({
    refresh: fetchStreakLeaderboard
  }));

  useEffect(() => {
    fetchStreakLeaderboard();
  }, [fetchStreakLeaderboard]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 text-lg">No streak champions yet!</div>
        <p className="text-gray-400 mt-2">
          Complete at least 1 unit per day for 5 consecutive days to appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, index) => (
        <LeaderboardCard
          key={entry.user_id}
          rank={entry.rank_position}
          name={entry.user_name}
          email={entry.user_email}
          primaryStat={{
            label: "Current Streak",
            value: `${entry.current_streak} days`,
            icon: "🔥"
          }}
          secondaryStat={{
            label: "Longest Streak",
            value: `${entry.longest_streak} days`
          }}
          isTopThree={index < 3}
          userId={entry.user_id}
        />
      ))}
    </div>
  );
});

StreakLeaderboard.displayName = 'StreakLeaderboard';

export default StreakLeaderboard;
