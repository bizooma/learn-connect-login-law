
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, Users, Award, TrendingUp, LogOut } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user, signOut } = useAuth();

  const stats = [
    {
      title: "Courses Enrolled",
      value: "3",
      description: "Active learning paths",
      icon: BookOpen,
      color: "text-blue-600",
    },
    {
      title: "Hours Completed",
      value: "24",
      description: "This month",
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: "Certificates",
      value: "2",
      description: "Earned this year",
      icon: Award,
      color: "text-yellow-600",
    },
    {
      title: "Study Group",
      value: "12",
      description: "Active members",
      icon: Users,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.user_metadata?.first_name || "Student"}!
              </h1>
              <p className="text-gray-600 mt-1">
                Continue your legal education journey
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/courses">
                <Button variant="outline" className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse Courses
                </Button>
              </Link>
              <Button
                variant="ghost"
                onClick={signOut}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Continue Learning</CardTitle>
              <CardDescription>
                Pick up where you left off in your current courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">Constitutional Law Fundamentals</h4>
                    <p className="text-sm text-gray-600">Chapter 3: Federal Powers</p>
                  </div>
                  <Button size="sm">Continue</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">Criminal Law Essentials</h4>
                    <p className="text-sm text-gray-600">Chapter 5: Defense Strategies</p>
                  </div>
                  <Button size="sm">Continue</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Recommended Courses</CardTitle>
              <CardDescription>
                Based on your learning history and interests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">Advanced Contract Law</h4>
                    <p className="text-sm text-gray-600">10 weeks • Advanced</p>
                  </div>
                  <Button size="sm" variant="outline">Enroll</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">Legal Research Methods</h4>
                    <p className="text-sm text-gray-600">6 weeks • Beginner</p>
                  </div>
                  <Button size="sm" variant="outline">Enroll</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
