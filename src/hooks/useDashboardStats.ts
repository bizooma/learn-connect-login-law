
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

interface DashboardStats {
  totalCourses: number;
  assignedCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  certificatesEarned: number;
  averageProgress: number;
  totalUsers?: number;
  activeUsers?: number;
}

export const useDashboardStats = () => {
  const { user } = useAuth();
  const { isAdmin, isOwner, isStudent, isClient } = useUserRole();
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    assignedCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    certificatesEarned: 0,
    averageProgress: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    if (!user?.id) {
      console.log('useDashboardStats: No user ID, skipping fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('useDashboardStats: Fetching stats for user', user.id, { isAdmin, isOwner, isStudent, isClient });

      if (isAdmin || isOwner) {
        // Admin/Owner stats - system-wide
        const [coursesResult, usersResult, progressResult] = await Promise.all([
          supabase.from('courses').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('user_course_progress').select('status, progress_percentage', { count: 'exact' })
        ]);

        const totalCourses = coursesResult.count || 0;
        const totalUsers = usersResult.count || 0;
        
        const progressData = progressResult.data || [];
        const completedCourses = progressData.filter(p => p.status === 'completed').length;
        const inProgressCourses = progressData.filter(p => p.status === 'in_progress').length;
        const totalProgress = progressData.reduce((sum, p) => sum + (p.progress_percentage || 0), 0);
        const averageProgress = progressData.length > 0 ? totalProgress / progressData.length : 0;

        setStats({
          totalCourses,
          assignedCourses: progressData.length,
          completedCourses,
          inProgressCourses,
          certificatesEarned: completedCourses, // Assuming 1 cert per completed course
          averageProgress,
          totalUsers,
          activeUsers: totalUsers // Simplified for now
        });

      } else if (isStudent || isClient) {
        // Student/Client stats - personal
        const { data: progressData } = await supabase
          .from('user_course_progress')
          .select('*')
          .eq('user_id', user.id);

        const assignedCourses = progressData?.length || 0;
        const completedCourses = progressData?.filter(p => p.status === 'completed').length || 0;
        const inProgressCourses = progressData?.filter(p => p.status === 'in_progress').length || 0;
        const totalProgress = progressData?.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) || 0;
        const averageProgress = assignedCourses > 0 ? totalProgress / assignedCourses : 0;

        // Get total available courses
        const { count: totalCourses } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalCourses: totalCourses || 0,
          assignedCourses,
          completedCourses,
          inProgressCourses,
          certificatesEarned: completedCourses,
          averageProgress
        });

      } else {
        // Default user stats
        const { count: totalCourses } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalCourses: totalCourses || 0,
          assignedCourses: 0,
          completedCourses: 0,
          inProgressCourses: 0,
          certificatesEarned: 0,
          averageProgress: 0
        });
      }

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Set fallback stats on error
      setStats({
        totalCourses: 0,
        assignedCourses: 0,
        completedCourses: 0,
        inProgressCourses: 0,
        certificatesEarned: 0,
        averageProgress: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if we have user ID and role is determined
    if (user?.id && (isAdmin || isOwner || isStudent || isClient)) {
      fetchStats();
    } else {
      console.log('useDashboardStats: Waiting for user and role', { 
        hasUserId: !!user?.id, 
        hasRole: !!(isAdmin || isOwner || isStudent || isClient) 
      });
    }
  }, [user?.id, isAdmin, isOwner, isStudent, isClient]);

  return { stats, loading, refetch: fetchStats };
};
