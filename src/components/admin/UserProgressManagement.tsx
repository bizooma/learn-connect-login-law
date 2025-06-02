import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, User, BookOpen, CheckCircle, Clock } from "lucide-react";
import { usePagination } from "./user-management/usePagination";
import UserProgressFilter from "./user-progress/UserProgressFilter";
import UserProgressModal from "./user-progress/UserProgressModal";

interface UserProgress {
  user_id: string;
  user_email: string;
  user_name: string;
  course_id: string;
  course_title: string;
  status: string;
  progress_percentage: number;
  started_at: string | null;
  completed_at: string | null;
  last_accessed_at: string | null;
  completed_units: number;
  total_units: number;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

const ITEMS_PER_PAGE = 50;

const UserProgressManagement = () => {
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [selectedUserForModal, setSelectedUserForModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [courses, setCourses] = useState<Array<{id: string, title: string}>>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const { toast } = useToast();

  // Filter progress data
  const filteredProgress = userProgress.filter(progress => {
    const matchesSearch = progress.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         progress.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         progress.course_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = courseFilter === "all" || progress.course_id === courseFilter;
    const matchesStatus = statusFilter === "all" || progress.status === statusFilter;
    const matchesUser = selectedUserId === "all" || progress.user_id === selectedUserId;
    
    return matchesSearch && matchesCourse && matchesStatus && matchesUser;
  });

  // Use pagination hook
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedProgress,
    goToPage,
    resetPagination,
    hasNextPage,
    hasPreviousPage,
  } = usePagination({
    data: filteredProgress,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  // Reset pagination when filters change
  useEffect(() => {
    resetPagination();
  }, [searchTerm, courseFilter, statusFilter, selectedUserId, resetPagination]);

  const fetchUserProgress = async () => {
    try {
      setLoading(true);
      
      // Fetch user course progress with user and course details
      const { data: progressData, error: progressError } = await supabase
        .from('user_course_progress')
        .select(`
          *,
          profiles:user_id (email, first_name, last_name),
          courses:course_id (title)
        `)
        .order('last_accessed_at', { ascending: false });

      if (progressError) throw progressError;

      // Fetch unit counts for each course
      const courseIds = [...new Set(progressData?.map(p => p.course_id))];
      const unitCounts = await Promise.all(
        courseIds.map(async (courseId) => {
          const { data: lessons } = await supabase
            .from('lessons')
            .select('id')
            .eq('course_id', courseId);

          if (!lessons || lessons.length === 0) return { courseId, totalUnits: 0 };

          const { count } = await supabase
            .from('units')
            .select('*', { count: 'exact', head: true })
            .in('section_id', lessons.map(l => l.id));

          return { courseId, totalUnits: count || 0 };
        })
      );

      // Fetch completed unit counts for each user-course combination
      const completedUnitCounts = await Promise.all(
        progressData?.map(async (progress) => {
          const { count } = await supabase
            .from('user_unit_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', progress.user_id)
            .eq('course_id', progress.course_id)
            .eq('completed', true);

          return { 
            userId: progress.user_id, 
            courseId: progress.course_id, 
            completedUnits: count || 0 
          };
        }) || []
      );

      // Transform the data
      const formattedProgress: UserProgress[] = progressData?.map(progress => {
        const profile = progress.profiles;
        const course = progress.courses;
        const unitCount = unitCounts.find(uc => uc.courseId === progress.course_id);
        const completedCount = completedUnitCounts.find(
          cc => cc.userId === progress.user_id && cc.courseId === progress.course_id
        );

        return {
          user_id: progress.user_id,
          user_email: profile?.email || 'Unknown',
          user_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Unknown',
          course_id: progress.course_id,
          course_title: course?.title || 'Unknown Course',
          status: progress.status,
          progress_percentage: progress.progress_percentage,
          started_at: progress.started_at,
          completed_at: progress.completed_at,
          last_accessed_at: progress.last_accessed_at,
          completed_units: completedCount?.completedUnits || 0,
          total_units: unitCount?.totalUnits || 0
        };
      }) || [];

      setUserProgress(formattedProgress);
      
      // Extract unique courses for filter
      const uniqueCourses = [...new Set(progressData?.map(p => ({ id: p.course_id, title: p.courses?.title || 'Unknown Course' })))];
      setCourses(uniqueCourses);

      // Extract unique users for filter
      const uniqueUsers = [...new Set(progressData?.map(p => ({
        id: p.user_id,
        name: `${p.profiles?.first_name || ''} ${p.profiles?.last_name || ''}`.trim() || 'Unknown',
        email: p.profiles?.email || 'Unknown'
      })))];
      setUsers(uniqueUsers);

    } catch (error) {
      console.error('Error fetching user progress:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user progress data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProgress();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'not_started':
        return <Badge className="bg-gray-100 text-gray-800">Not Started</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewUserProgress = (userId: string) => {
    setSelectedUserForModal(userId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Get unique user count for statistics
  const uniqueUserCount = new Set(userProgress.map(p => p.user_id)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Progress Tracking</h2>
          <p className="text-gray-600">Monitor user course and unit completion progress</p>
        </div>
        <Button variant="outline" onClick={() => fetchUserProgress()}>
          <Download className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueUserCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Enrollments</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProgress.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Courses</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userProgress.filter(p => p.status === 'completed').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userProgress.filter(p => p.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by user name, email, or course..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <UserProgressFilter
              users={users}
              selectedUserId={selectedUserId}
              onUserChange={setSelectedUserId}
            />
            
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Progress Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Course Progress</CardTitle>
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredProgress.length)} of {filteredProgress.length} results
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Units Completed</TableHead>
                <TableHead>Last Accessed</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProgress.map((progress, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{progress.user_name}</div>
                      <div className="text-sm text-gray-500">{progress.user_email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{progress.course_title}</TableCell>
                  <TableCell>{getStatusBadge(progress.status)}</TableCell>
                  <TableCell>
                    <div className="w-20">
                      <div className="text-sm font-medium">{progress.progress_percentage}%</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${progress.progress_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {progress.completed_units}/{progress.total_units}
                  </TableCell>
                  <TableCell>
                    {progress.last_accessed_at 
                      ? new Date(progress.last_accessed_at).toLocaleDateString()
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewUserProgress(progress.user_id)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={!hasPreviousPage}
                >
                  Previous
                </Button>
                
                {/* Page numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={!hasNextPage}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced User Progress Modal */}
      <UserProgressModal
        isOpen={!!selectedUserForModal}
        onClose={() => setSelectedUserForModal(null)}
        userId={selectedUserForModal}
      />
    </div>
  );
};

export default UserProgressManagement;
