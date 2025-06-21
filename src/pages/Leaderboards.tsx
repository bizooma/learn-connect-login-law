
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Flame, Target, Users } from "lucide-react";
import StreakLeaderboard from "@/components/leaderboards/StreakLeaderboard";
import CategoryLeaderboard from "@/components/leaderboards/CategoryLeaderboard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Leaderboards = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  const handleRefreshCache = async () => {
    try {
      const { error } = await supabase.rpc('refresh_leaderboard_cache');
      if (error) throw error;
      
      setRefreshKey(prev => prev + 1);
      toast({
        title: "Success",
        description: "Leaderboards have been refreshed",
      });
    } catch (error) {
      console.error('Error refreshing leaderboard cache:', error);
      toast({
        title: "Error",
        description: "Failed to refresh leaderboards",
        variant: "destructive",
      });
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
        <button
          onClick={handleRefreshCache}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Rankings
        </button>
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
                Users who have completed at least 1 unit per day for 5+ consecutive days
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
                Top 10% of learners by completion rate in Sales courses
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
                Top 10% of learners by completion rate in Legal courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryLeaderboard category="Legal" key={refreshKey} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Leaderboards;
