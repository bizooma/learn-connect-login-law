
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useCourseAssignments } from "@/hooks/useCourseAssignments";
import { BookOpen, Clock, Trophy, Play, Calendar, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const StudentDashboard = () => {
  const { user, signOut } = useAuth();
  const { isStudent } = useUserRole();
  const { assignments, loading } = useCourseAssignments();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("current");

  // Filter assignments for the current user
  const userAssignments = assignments.filter(assignment => assignment.user_id === user?.id);
  const currentCourses = userAssignments.filter(assignment => 
    !assignment.courses?.rating || assignment.courses.rating < 100
  );
  const completedCourses = userAssignments.filter(assignment => 
    assignment.courses?.rating === 100
  );

  // Redirect if not a student
  useEffect(() => {
    if (!loading && !isStudent) {
      navigate("/");
    }
  }, [isStudent, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isStudent) {
    return null; // Will redirect in useEffect
  }

  const getStatusColor = (isCompleted: boolean, isMandatory: boolean) => {
    if (isCompleted) return "bg-green-500";
    if (isMandatory) return "bg-red-500";
    return "bg-blue-500";
  };

  const getStatusText = (isCompleted: boolean, isMandatory: boolean) => {
    if (isCompleted) return "Completed";
    if (isMandatory) return "Mandatory";
    return "Optional";
  };

  const stats = [
    {
      title: "Assigned Courses",
      value: userAssignments.length.toString(),
      description: "Total courses assigned",
      icon: BookOpen,
      color: "text-blue-600",
    },
    {
      title: "In Progress",
      value: currentCourses.length.toString(),
      description: "Currently taking",
      icon: Play,
      color: "text-orange-600",
    },
    {
      title: "Completed",
      value: completedCourses.length.toString(),
      description: "Courses finished",
      icon: Trophy,
      color: "text-green-600",
    },
    {
      title: "Mandatory",
      value: userAssignments.filter(a => a.is_mandatory).length.toString(),
      description: "Required courses",
      icon: Calendar,
      color: "text-red-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Student Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {user?.user_metadata?.first_name || "Student"}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate("/courses")}
                className="flex items-center"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Courses
              </Button>
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

        {/* Main Content */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>My Courses</CardTitle>
            <CardDescription>
              Manage your assigned courses and track your progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="current">Current Courses</TabsTrigger>
                <TabsTrigger value="completed">Completed Courses</TabsTrigger>
              </TabsList>
              
              <TabsContent value="current" className="mt-6">
                {currentCourses.length > 0 ? (
                  <div className="space-y-4">
                    {currentCourses.map((assignment) => (
                      <div key={assignment.id} className="border rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {assignment.courses?.title || "Unknown Course"}
                            </h3>
                            <p className="text-gray-600 text-sm mt-1">
                              {assignment.courses?.description || "No description available"}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {assignment.courses?.duration || "N/A"}
                              </span>
                              <span className="flex items-center gap-1">
                                <BookOpen className="h-4 w-4" />
                                {assignment.courses?.category || "N/A"}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={getStatusColor(false, assignment.is_mandatory)}>
                              {getStatusText(false, assignment.is_mandatory)}
                            </Badge>
                            {assignment.due_date && (
                              <span className="text-sm text-gray-500">
                                Due: {new Date(assignment.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {assignment.notes && (
                          <div className="mb-4 p-3 bg-gray-50 rounded">
                            <p className="text-sm text-gray-700">{assignment.notes}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex-1 mr-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>0%</span>
                            </div>
                            <Progress value={0} className="h-2" />
                          </div>
                          <Button
                            onClick={() => navigate(`/course/${assignment.course_id}`)}
                            size="sm"
                          >
                            Continue Learning
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No current courses</h3>
                    <p className="text-gray-600">You don't have any courses in progress.</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="completed" className="mt-6">
                {completedCourses.length > 0 ? (
                  <div className="space-y-4">
                    {completedCourses.map((assignment) => (
                      <div key={assignment.id} className="border rounded-lg p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {assignment.courses?.title || "Unknown Course"}
                            </h3>
                            <p className="text-gray-600 text-sm mt-1">
                              {assignment.courses?.description || "No description available"}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {assignment.courses?.duration || "N/A"}
                              </span>
                              <span className="flex items-center gap-1">
                                <BookOpen className="h-4 w-4" />
                                {assignment.courses?.category || "N/A"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Trophy className="h-4 w-4" />
                                Completed
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className="bg-green-500">
                              Completed
                            </Badge>
                            <span className="text-sm font-medium text-green-600">100%</span>
                          </div>
                        </div>
                        
                        {assignment.notes && (
                          <div className="mt-4 p-3 bg-gray-50 rounded">
                            <p className="text-sm text-gray-700">{assignment.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No completed courses</h3>
                    <p className="text-gray-600">You haven't completed any courses yet.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
