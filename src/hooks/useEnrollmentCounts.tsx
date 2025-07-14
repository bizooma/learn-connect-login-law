
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeManager } from "./useRealtimeManager";

interface EnrollmentCount {
  course_id: string;
  enrollment_count: number;
}

export const useEnrollmentCounts = (enabled: boolean = true) => {
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { createChannel, removeChannel } = useRealtimeManager({ enabled });

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
      console.error('Error fetching enrollment counts:', error);
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

    if (!enabled) {
      console.log('Enrollment counts realtime disabled');
      return;
    }

    // Set up optimized real-time subscription
    const channelId = 'enrollment-updates';
    createChannel(channelId, [
      {
        event: '*',
        table: 'course_assignments',
        callback: () => fetchEnrollmentCounts()
      },
      {
        event: '*',
        table: 'user_course_progress',
        callback: () => fetchEnrollmentCounts()
      }
    ]);

    return () => {
      removeChannel(channelId);
    };
  }, [enabled, createChannel, removeChannel]);

  return {
    enrollmentCounts,
    loading,
    refreshEnrollmentCounts: fetchEnrollmentCounts
  };
};
