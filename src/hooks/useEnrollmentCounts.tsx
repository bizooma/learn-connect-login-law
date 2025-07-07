
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

interface EnrollmentCount {
  course_id: string;
  enrollment_count: number;
}

export const useEnrollmentCounts = () => {
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchEnrollmentCounts = async () => {
    try {
      setLoading(true);
      
      // Get all course assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('course_assignments')
        .select('course_id, user_id');

      if (assignmentsError) {
        throw assignmentsError;
      }

      // Get all active users (not deleted)
      const { data: activeUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_deleted', false);

      if (usersError) {
        throw usersError;
      }

      // Create a Set of active user IDs for quick lookup
      const activeUserIds = new Set(activeUsers?.map(user => user.id) || []);

      // Count enrollments per course, only for active users
      const enrollmentMap: Record<string, number> = {};
      
      if (assignments) {
        assignments.forEach(assignment => {
          // Only count if the user is active (not deleted)
          if (activeUserIds.has(assignment.user_id)) {
            if (!enrollmentMap[assignment.course_id]) {
              enrollmentMap[assignment.course_id] = 0;
            }
            enrollmentMap[assignment.course_id]++;
          }
        });
      }

      setEnrollmentCounts(enrollmentMap);
    } catch (error) {
      logger.error('Error fetching enrollment counts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch enrollment counts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollmentCounts();

    // Set up real-time subscription for course assignments
    const assignmentChannel = supabase
      .channel('enrollment-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'course_assignments'
        },
        () => {
          fetchEnrollmentCounts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_course_progress'
        },
        () => {
          fetchEnrollmentCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(assignmentChannel);
    };
  }, []);

  return {
    enrollmentCounts,
    loading,
    refreshEnrollmentCounts: fetchEnrollmentCounts
  };
};
