
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
      
      // Get enrollment counts from course_assignments
      const { data: assignmentCounts, error: assignmentError } = await supabase
        .from('course_assignments')
        .select('course_id')
        .eq('is_mandatory', false); // Include all assignments

      if (assignmentError) {
        throw assignmentError;
      }

      // Also get counts from user_course_progress for users who might have progress without explicit assignment
      const { data: progressCounts, error: progressError } = await supabase
        .from('user_course_progress')
        .select('course_id');

      if (progressError) {
        throw progressError;
      }

      // Combine and count unique enrollments per course
      const allEnrollments = [...(assignmentCounts || []), ...(progressCounts || [])];
      const courseEnrollments: Record<string, Set<string>> = {};

      // For assignments, we count each assignment
      assignmentCounts?.forEach(assignment => {
        if (!courseEnrollments[assignment.course_id]) {
          courseEnrollments[assignment.course_id] = new Set();
        }
        courseEnrollments[assignment.course_id].add(assignment.course_id + '_assignment');
      });

      // For progress, we count each unique user
      progressCounts?.forEach(progress => {
        if (!courseEnrollments[progress.course_id]) {
          courseEnrollments[progress.course_id] = new Set();
        }
        courseEnrollments[progress.course_id].add(progress.course_id + '_progress');
      });

      // Get more accurate count by querying assignments with user info
      const { data: detailedAssignments, error: detailedError } = await supabase
        .from('course_assignments')
        .select(`
          course_id,
          user_id,
          profiles!inner(id, is_deleted)
        `);

      if (detailedError) {
        console.error('Error fetching detailed assignments:', detailedError);
      }

      // Count active users per course
      const enrollmentMap: Record<string, number> = {};
      
      if (detailedAssignments) {
        detailedAssignments.forEach(assignment => {
          // Only count non-deleted users
          if (!assignment.profiles?.is_deleted) {
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
