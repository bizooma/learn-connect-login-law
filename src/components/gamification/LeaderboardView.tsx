
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Crown, Medal, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { hasGamificationAccess } from "@/utils/gamificationAccess";

interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  current_level: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  rank: number;
}

const LeaderboardView = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      
      // Get all users with points who have gamification access
      const { data: pointsData } = await supabase
        .from('user_points')
        .select(`
          user_id,
          total_points,
          current_level,
          profiles!inner (
            email,
            first_name,
            last_name
          )
        `)
        .order('total_points', { ascending: false });

      if (pointsData) {
        // Filter for users with gamification access and add rank
        const filteredData = pointsData
          .filter((entry: any) => hasGamificationAccess(entry.profiles.email))
          .map((entry: any, index: number) => ({
            user_id: entry.user_id,
            total_points: entry.total_points,
            current_level: entry.current_level,
            email: entry.profiles.email,
            first_name: entry.profiles.first_name,
            last_name: entry.profiles.last_name,
            rank: index + 1
          }));

        setLeaderboard(filteredData);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-orange-600" />;
      default:
        return <Trophy className="h-5 w-5 text-gray-600" />;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 2:
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 3:
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded mb-2"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="points" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="points">Total Points</TabsTrigger>
            <TabsTrigger value="level">Level</TabsTrigger>
          </TabsList>

          <TabsContent value="points" className="space-y-3 mt-4">
            {leaderboard.map((entry) => (
              <div
                key={entry.user_id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Badge className={getRankBadgeColor(entry.rank)}>
                    #{entry.rank}
                  </Badge>
                  {getRankIcon(entry.rank)}
                  <div>
                    <p className="font-medium">
                      {entry.first_name && entry.last_name 
                        ? `${entry.first_name} ${entry.last_name}` 
                        : entry.email}
                    </p>
                    <p className="text-sm text-gray-600">Level {entry.current_level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{entry.total_points.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">XP</p>
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No leaderboard data available yet.
              </p>
            )}
          </TabsContent>

          <TabsContent value="level" className="space-y-3 mt-4">
            {[...leaderboard]
              .sort((a, b) => b.current_level - a.current_level)
              .map((entry, index) => (
                <div
                  key={entry.user_id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    index < 3 ? 'bg-gradient-to-r from-blue-50 to-purple-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Badge className={getRankBadgeColor(index + 1)}>
                      #{index + 1}
                    </Badge>
                    {getRankIcon(index + 1)}
                    <div>
                      <p className="font-medium">
                        {entry.first_name && entry.last_name 
                          ? `${entry.first_name} ${entry.last_name}` 
                          : entry.email}
                      </p>
                      <p className="text-sm text-gray-600">{entry.total_points.toLocaleString()} XP</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">Level {entry.current_level}</p>
                  </div>
                </div>
              ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LeaderboardView;
