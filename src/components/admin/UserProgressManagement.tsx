
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "./user-management/usePagination";
import UserProgressModal from "./user-progress/UserProgressModal";
import UserProgressManagementHeader from "./user-progress/UserProgressManagementHeader";
import UserProgressStatsCards from "./user-progress/UserProgressStatsCards";
import UserProgressFilters from "./user-progress/UserProgressFilters";
import UserProgressTable from "./user-progress/UserProgressTable";
import { exportToCSV, formatDateForCSV } from "@/lib/csvUtils";

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

// Helper function to get display title for courses
const getCourseDisplayTitle = (title: string | null | undefined): string => {
  if (!title || title.trim() === '') {
    return 'Untitled Course';
  }
  return title;
};

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
          course_title: getCourseDisplayTitle(course?.title),
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
      const uniqueCourses = [...new Set(progressData?.map(p => ({ 
        id: p.course_id, 
        title: getCourseDisplayTitle(p.courses?.title)
      })))];
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

  const handleViewUserProgress = (userId: string) => {
    setSelectedUserForModal(userId);
  };

  const handleExportCSV = () => {
    if (filteredProgress.length === 0) {
      toast({
        title: "No Data",
        description: "No progress data available to export",
        variant: "destructive",
      });
      return;
    }

    const csvData = filteredProgress.map(progress => ({
      'User Name': progress.user_name,
      'User Email': progress.user_email,
      'Course Title': progress.course_title,
      'Status': progress.status,
      'Progress Percentage': `${progress.progress_percentage}%`,
      'Units Completed': progress.completed_units,
      'Total Units': progress.total_units,
      'Units Progress': `${progress.completed_units}/${progress.total_units}`,
      'Started Date': formatDateForCSV(progress.started_at),
      'Completed Date': formatDateForCSV(progress.completed_at),
      'Last Accessed': formatDateForCSV(progress.last_accessed_at)
    }));

    const timestamp = new Date().toISOString().split('T')[0];
    let filename = `user_progress_report_${timestamp}.csv`;
    
    // Add filter info to filename if filters are applied
    const appliedFilters = [];
    if (searchTerm) appliedFilters.push('filtered');
    if (selectedUserId !== 'all') appliedFilters.push('user-specific');
    if (courseFilter !== 'all') appliedFilters.push('course-specific');
    if (statusFilter !== 'all') appliedFilters.push(statusFilter);
    
    if (appliedFilters.length > 0) {
      filename = `user_progress_report_${appliedFilters.join('_')}_${timestamp}.csv`;
    }

    exportToCSV(csvData, filename);
    
    toast({
      title: "Export Successful",
      description: `Exported ${filteredProgress.length} progress records to CSV`,
    });
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
      <UserProgressManagementHeader
        onExportCSV={handleExportCSV}
        onRefreshData={fetchUserProgress}
        hasData={filteredProgress.length > 0}
      />

      <UserProgressStatsCards
        uniqueUserCount={uniqueUserCount}
        totalEnrollments={userProgress.length}
        completedCourses={userProgress.filter(p => p.status === 'completed').length}
        inProgressCourses={userProgress.filter(p => p.status === 'in_progress').length}
      />

      <UserProgressFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedUserId={selectedUserId}
        onUserChange={setSelectedUserId}
        courseFilter={courseFilter}
        onCourseChange={setCourseFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        users={users}
        courses={courses}
      />

      <UserProgressTable
        paginatedProgress={paginatedProgress}
        onViewUserProgress={handleViewUserProgress}
        currentPage={currentPage}
        totalPages={totalPages}
        totalResults={filteredProgress.length}
        itemsPerPage={ITEMS_PER_PAGE}
        goToPage={goToPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
      />

      <UserProgressModal
        isOpen={!!selectedUserForModal}
        onClose={() => setSelectedUserForModal(null)}
        userId={selectedUserForModal}
      />
    </div>
  );
};

export default UserProgressManagement;
