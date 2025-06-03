
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, Target, TrendingUp, Award, Flame } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";
import AchievementsBadge from "./AchievementsBadge";
import LeaderboardView from "./LeaderboardView";

const GamificationDashboard = () => {
  const { userPoints, achievements, userAchievements, learningStreak, recentTransactions, loading } = useGamification();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const earnedAchievementIds = userAchievements.map(ua => ua.achievement_id);
  const availableAchievements = achievements.filter(a => !earnedAchievementIds.includes(a.id));

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Level</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userPoints?.current_level || 1}</div>
            <div className="text-xs text-muted-foreground">
              {userPoints?.points_to_next_level || 100} XP to next level
            </div>
            <Progress 
              value={userPoints ? ((100 - userPoints.points_to_next_level) / 100) * 100 : 0} 
              className="mt-2 h-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total XP</CardTitle>
            <Star className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userPoints?.total_points || 0}</div>
            <div className="text-xs text-muted-foreground">Experience Points</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userAchievements.length}</div>
            <div className="text-xs text-muted-foreground">
              of {achievements.length} unlocked
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{learningStreak?.current_streak || 0}</div>
            <div className="text-xs text-muted-foreground">
              Best: {learningStreak?.longest_streak || 0} days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="achievements" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid gap-4">
            {/* Earned Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  Earned Achievements ({userAchievements.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {userAchievements.map((userAchievement) => (
                    <AchievementsBadge 
                      key={userAchievement.id}
                      achievement={userAchievement.achievements}
                      earned={true}
                      earnedAt={userAchievement.earned_at}
                    />
                  ))}
                </div>
                {userAchievements.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No achievements earned yet. Complete courses and quizzes to start earning badges!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Available Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-gray-600" />
                  Available Achievements ({availableAchievements.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableAchievements.map((achievement) => (
                    <AchievementsBadge 
                      key={achievement.id}
                      achievement={achievement}
                      earned={false}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <LeaderboardView />
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      +{transaction.points_earned} XP
                    </Badge>
                  </div>
                ))}
                {recentTransactions.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No activity yet. Start learning to earn your first points!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GamificationDashboard;
