
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, User, HelpCircle } from "lucide-react";

interface AdminStatsCardsProps {
  stats: {
    totalCourses: number;
    totalUsers: number;
    activeEnrollments: number;
    totalQuizzes: number;
  };
}

const AdminStatsCards = ({ stats }: AdminStatsCardsProps) => {
  const adminStats = [
    {
      title: "Total Courses",
      value: stats.totalCourses.toString(),
      description: "Active courses",
      icon: BookOpen,
      color: "text-blue-600",
    },
    {
      title: "Total Users",
      value: stats.totalUsers.toString(),
      description: "Registered users",
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Active Enrollments",
      value: stats.activeEnrollments.toString(),
      description: "Current enrollments",
      icon: User,
      color: "text-purple-600",
    },
    {
      title: "Total Quizzes",
      value: stats.totalQuizzes.toString(),
      description: "Available quizzes",
      icon: HelpCircle,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {adminStats.map((stat) => (
        <Card key={stat.title} className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminStatsCards;
