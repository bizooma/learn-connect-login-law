
import { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LeaderboardCard from "./LeaderboardCard";

interface CategoryLeaderboardEntry {
  user_id: string;
  user_name: string;
  user_email: string;
  completion_rate?: number;
  courses_completed?: number;
  total_courses?: number;
  rank_position: number;
  score?: number;
  additional_data?: any;
}

interface CategoryLeaderboardProps {
  category: string;
}

export interface CategoryLeaderboardRef {
  refresh: () => void;
}

const CategoryLeaderboard = forwardRef<CategoryLeaderboardRef, CategoryLeaderboardProps>(({ category }, ref) => {
  const [entries, setEntries] = useState<CategoryLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCategoryLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      
      const leaderboardType = category.toLowerCase() + '_training';
      
      // First try to get from cache
      const { data: cachedData, error: cacheError } = await supabase
        .from('leaderboard_cache')
        .select('*')
        .eq('leaderboard_type', leaderboardType)
        .gt('expires_at', new Date().toISOString())
        .order('rank_position', { ascending: true });

      if (cacheError) {
        console.error('Error fetching cached leaderboard:', cacheError);
      }

      if (cachedData && cachedData.length > 0) {
        setEntries(cachedData);
      } else {
        // If no cache, generate fresh data
        const { data: freshData, error: freshError } = await supabase
          .rpc('generate_category_leaderboard', { 
            p_category: category,
            p_limit: 20 
          });

        if (freshError) {
          throw freshError;
        }

        setEntries(freshData || []);
      }
    } catch (error) {
      console.error('Error fetching category leaderboard:', error);
      toast({
        title: "Error",
        description: `Failed to load ${category} leaderboard`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [category, toast]);

  useImperativeHandle(ref, () => ({
    refresh: fetchCategoryLeaderboard
  }));

  useEffect(() => {
    fetchCategoryLeaderboard();
  }, [fetchCategoryLeaderboard]);

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
        <div className="text-gray-500 text-lg">No {category.toLowerCase()} leaders yet!</div>
        <p className="text-gray-400 mt-2">
          Complete {category.toLowerCase()} courses to compete for the top spots.
        </p>
      </div>
    );
  }

  const formattedEntries = useMemo(() => {
    return entries.map(entry => ({
      user_id: entry.user_id,
      user_name: entry.user_name,
      user_email: entry.user_email,
      completion_rate: (entry.additional_data as any)?.completion_rate || entry.score,
      courses_completed: (entry.additional_data as any)?.courses_completed || 0,
      total_courses: (entry.additional_data as any)?.total_courses || 0,
      rank_position: entry.rank_position
    }));
  }, [entries]);

  return (
    <div className="space-y-3">
      {formattedEntries.map((entry, index) => (
        <LeaderboardCard
          key={entry.user_id}
          rank={entry.rank_position}
          name={entry.user_name}
          email={entry.user_email}
          primaryStat={{
            label: "Completion Rate",
            value: `${entry.completion_rate}%`,
            icon: "🎯"
          }}
          secondaryStat={{
            label: "Courses",
            value: `${entry.courses_completed}/${entry.total_courses}`
          }}
          isTopThree={index < 3}
          userId={entry.user_id}
        />
      ))}
    </div>
  );
});

CategoryLeaderboard.displayName = 'CategoryLeaderboard';

export default CategoryLeaderboard;
