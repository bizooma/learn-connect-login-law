
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, TrendingUp, AlertCircle } from "lucide-react";

interface MiniLeaderboardProps {
  type: 'learning_streak' | 'sales_training' | 'legal_training';
  title: string;
  icon?: React.ReactNode;
  limit?: number;
}

interface MiniLeaderboardEntry {
  user_name: string;
  score: number;
  rank_position: number;
  additional_data?: any;
}

const MiniLeaderboard = ({ type, title, icon, limit = 5 }: MiniLeaderboardProps) => {
  const [entries, setEntries] = useState<MiniLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMiniLeaderboard();
  }, [type]);

  const fetchMiniLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch from cache first
      const { data, error } = await supabase
        .from('leaderboard_cache')
        .select('user_name, score, rank_position, additional_data')
        .eq('leaderboard_type', type)
        .gt('expires_at', new Date().toISOString())
        .order('rank_position', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching mini leaderboard:', error);
        setError(error.message);
        return;
      }

      if (!data || data.length === 0) {
        // Try to fetch fresh data directly from tables
        await fetchFreshData();
      } else {
        setEntries(data || []);
      }
    } catch (error: any) {
      console.error('Error fetching mini leaderboard:', error);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFreshData = async () => {
    try {
      if (type === 'learning_streak') {
        const { data, error } = await supabase
          .from('user_learning_streaks')
          .select(`
            user_id,
            current_streak,
            longest_streak,
            profiles!inner(first_name, last_name, email, is_deleted)
          `)
          .eq('profiles.is_deleted', false)
          .gte('current_streak', 1)
          .order('current_streak', { ascending: false })
          .limit(limit);

        if (error) throw error;

        const formattedData = data?.map((entry: any, index: number) => ({
          user_name: `${entry.profiles.first_name} ${entry.profiles.last_name}`,
          score: entry.current_streak,
          rank_position: index + 1,
          additional_data: {
            current_streak: entry.current_streak,
            longest_streak: entry.longest_streak
          }
        })) || [];

        setEntries(formattedData);
      } else {
        // For category leaderboards, show a message that data needs to be populated
        setError(`No ${type.replace('_', ' ')} data available. Please refresh the leaderboards.`);
      }
    } catch (error: any) {
      console.error('Error fetching fresh data:', error);
      setError(`Failed to load ${type.replace('_', ' ')} data`);
    }
  };

  const formatScore = (score: number) => {
    if (type === 'learning_streak') {
      return `${score} days`;
    }
    return `${score}%`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            {icon || <Trophy className="h-4 w-4" />}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            {icon || <Trophy className="h-4 w-4" />}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-500 text-center py-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
          <button
            onClick={fetchMiniLeaderboard}
            className="text-xs text-blue-600 hover:text-blue-800 mt-2 w-full text-center"
          >
            Try Again
          </button>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            {icon || <Trophy className="h-4 w-4" />}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500 text-center py-4">
            No data available
            <button
              onClick={fetchMiniLeaderboard}
              className="block text-xs text-blue-600 hover:text-blue-800 mt-2 mx-auto"
            >
              Refresh Data
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {icon || <Trophy className="h-4 w-4" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                  index === 0 ? 'bg-yellow-100 text-yellow-800' :
                  index === 1 ? 'bg-gray-100 text-gray-700' :
                  index === 2 ? 'bg-amber-100 text-amber-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {entry.rank_position}
                </span>
                <span className="font-medium truncate max-w-[100px]">
                  {entry.user_name}
                </span>
              </div>
              <span className="font-semibold text-gray-900">
                {formatScore(entry.score)}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={fetchMiniLeaderboard}
          className="text-xs text-gray-500 hover:text-gray-700 mt-2 w-full text-center"
        >
          Refresh
        </button>
      </CardContent>
    </Card>
  );
};

export default MiniLeaderboard;
