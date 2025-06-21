
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle, Clock, Trophy, Flame, Target } from "lucide-react";
import MiniLeaderboard from "@/components/leaderboards/MiniLeaderboard";

interface StatItem {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface DashboardStatsProps {
  userId?: string;
  stats?: StatItem[];
}

const DashboardStats = ({ userId, stats }: DashboardStatsProps) => {
  const { user } = useAuth();
  const { stats: hookStats, loading } = useDashboardStats();

  // Use provided stats or fetch from hook
  const displayStats = stats || [
    {
      title: "Total Courses",
      value: loading ? "..." : hookStats.totalCourses.toString(),
      description: "Assigned to you",
      icon: BookOpen,
      color: "text-blue-600",
    },
    {
      title: "Completed",
      value: loading ? "..." : hookStats.completedCourses.toString(),
      description: `${hookStats.totalCourses > 0 ? Math.round((hookStats.completedCourses / hookStats.totalCourses) * 100) : 0}% completion rate`,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "In Progress",
      value: loading ? "..." : hookStats.inProgressCourses.toString(),
      description: "Currently learning",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Certificates",
      value: loading ? "..." : hookStats.certificatesEarned.toString(),
      description: "Earned certificates",
      icon: Trophy,
      color: "text-purple-600",
    },
  ];

  if (loading && !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mini Leaderboards - only show if user exists */}
      {user && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MiniLeaderboard
            type="learning_streak"
            title="Learning Streak Leaders"
            icon={<Flame className="h-4 w-4 text-orange-500" />}
            limit={5}
          />
          <MiniLeaderboard
            type="sales_training"
            title="Sales Training Top 5"
            icon={<Target className="h-4 w-4 text-green-500" />}
            limit={5}
          />
          <MiniLeaderboard
            type="legal_training"
            title="Legal Training Top 5"
            icon={<BookOpen className="h-4 w-4 text-blue-500" />}
            limit={5}
          />
        </div>
      )}
    </div>
  );
};

export default DashboardStats;
