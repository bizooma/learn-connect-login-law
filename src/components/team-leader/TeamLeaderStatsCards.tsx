import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, CheckCircle, TrendingUp } from "lucide-react";
import { TeamMemberProgress } from "@/hooks/useTeamLeaderProgress";

interface TeamLeaderStatsCardsProps {
  teamProgress: TeamMemberProgress[];
  loading: boolean;
}

const TeamLeaderStatsCards = ({ teamProgress, loading }: TeamLeaderStatsCardsProps) => {
  // Calculate aggregate statistics
  const totalMembers = teamProgress.length;
  const totalCoursesAssigned = teamProgress.reduce((sum, member) => sum + member.total_courses, 0);
  const totalCompleted = teamProgress.reduce((sum, member) => sum + member.completed_courses, 0);
  const averageProgress = totalCoursesAssigned > 0 
    ? Math.round((totalCompleted / totalCoursesAssigned) * 100) 
    : 0;

  const stats = [
    {
      title: "Team Members",
      value: loading ? "..." : totalMembers.toString(),
      description: "Total team size",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Courses Assigned",
      value: loading ? "..." : totalCoursesAssigned.toString(),
      description: "Across all members",
      icon: BookOpen,
      color: "text-purple-600",
    },
    {
      title: "Completed",
      value: loading ? "..." : totalCompleted.toString(),
      description: `${averageProgress}% average completion`,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Team Progress",
      value: loading ? "..." : `${averageProgress}%`,
      description: "Overall completion rate",
      icon: TrendingUp,
      color: "text-orange-600",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 bg-muted rounded animate-pulse mb-2"></div>
              <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
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
  );
};

export default TeamLeaderStatsCards;
