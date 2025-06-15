
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, Activity, BookOpen } from "lucide-react";
import type { SessionStats } from "./types";

interface SessionStatsCardsProps {
  stats: SessionStats[];
  loading: boolean;
}

const SessionStatsCards = ({ stats, loading }: SessionStatsCardsProps) => {
  const calculateTotals = () => {
    if (!stats.length) {
      return {
        totalUsers: 0,
        totalSessions: 0,
        totalTimeHours: 0,
        avgSessionMinutes: 0
      };
    }

    const totalUsers = stats.length;
    const totalSessions = stats.reduce((sum, stat) => sum + stat.total_sessions, 0);
    const totalTimeSeconds = stats.reduce((sum, stat) => sum + stat.total_time_seconds, 0);
    const totalTimeHours = Math.round(totalTimeSeconds / 3600 * 10) / 10;
    
    // Calculate weighted average session duration
    const totalSessionTime = stats.reduce((sum, stat) => sum + (stat.total_sessions * stat.avg_session_duration), 0);
    const avgSessionMinutes = totalSessions > 0 
      ? Math.round((totalSessionTime / totalSessions) / 60 * 10) / 10 
      : 0;

    return {
      totalUsers,
      totalSessions,
      totalTimeHours,
      avgSessionMinutes
    };
  };

  const totals = calculateTotals();

  const statCards = [
    {
      title: "Total Users",
      value: totals.totalUsers.toLocaleString(),
      icon: Users,
      description: "Active users in selected period"
    },
    {
      title: "Total Sessions",
      value: totals.totalSessions.toLocaleString(),
      icon: Activity,
      description: "Login sessions recorded"
    },
    {
      title: "Total Time",
      value: `${totals.totalTimeHours}h`,
      icon: Clock,
      description: "Combined session duration"
    },
    {
      title: "Avg Session",
      value: `${totals.avgSessionMinutes}m`,
      icon: BookOpen,
      description: "Average session length"
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="py-8">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-gray-500 mt-1">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SessionStatsCards;
