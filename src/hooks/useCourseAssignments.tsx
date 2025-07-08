
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import { Tables } from "@/integrations/supabase/types";

type CourseAssignment = Tables<'course_assignments'>;
type Profile = Tables<'profiles'>;
type Course = Tables<'courses'>;

interface CourseAssignmentWithDetails extends CourseAssignment {
  profiles?: Profile | null;
  courses?: Course | null;
}

export const useCourseAssignments = () => {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<CourseAssignmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      
      // First get the assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('course_assignments')
        .select('*')
        .order('assigned_at', { ascending: false });

      if (assignmentsError) {
        logger.error('Error fetching course assignments:', assignmentsError);
        throw assignmentsError;
      }

      // Then fetch profiles and courses separately to avoid foreign key issues
      const userIds = assignmentsData?.map(a => a.user_id) || [];
      const courseIds = assignmentsData?.map(a => a.course_id) || [];

      const [profilesResponse, coursesResponse] = await Promise.all([
        userIds.length > 0 ? supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', userIds) : { data: [], error: null },
        courseIds.length > 0 ? supabase
          .from('courses')
          .select('id, title, category, level')
          .in('id', courseIds) : { data: [], error: null }
      ]);

      if (profilesResponse.error) {
        logger.error('Error fetching profiles:', profilesResponse.error);
      }

      if (coursesResponse.error) {
        logger.error('Error fetching courses:', coursesResponse.error);
      }

      // Map the data together
      const assignmentsWithDetails = assignmentsData?.map(assignment => ({
        ...assignment,
        profiles: profilesResponse.data?.find(p => p.id === assignment.user_id) || null,
        courses: coursesResponse.data?.find(c => c.id === assignment.course_id) || null
      })) || [];

      setAssignments(assignmentsWithDetails);
    } catch (error) {
      logger.error('Error fetching assignments:', error);
      toast({
        title: "Error",
        description: "Failed to load course assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignCourse = async (userId: string, courseId: string, dueDate?: string, isMandatory: boolean = false, notes?: string) => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('course_assignments')
        .insert({
          user_id: userId,
          course_id: courseId,
          assigned_by: user.id,
          due_date: dueDate,
          is_mandatory: isMandatory,
          notes: notes
        });

      if (error) {
        logger.error('Error assigning course:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Course assigned successfully",
      });

      await fetchAssignments();
    } catch (error) {
      logger.error('Error assigning course:', error);
      toast({
        title: "Error",
        description: "Failed to assign course",
        variant: "destructive",
      });
    }
  };

  const markCourseCompleted = async (userId: string, courseId: string, completionDate?: string) => {
    try {
      const { error } = await supabase.rpc('mark_course_completed', {
        p_user_id: userId,
        p_course_id: courseId,
        p_completion_date: completionDate || new Date().toISOString()
      });

      if (error) {
        logger.error('Error marking course completed:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Course marked as completed",
      });

      await fetchAssignments();
    } catch (error) {
      logger.error('Error marking course completed:', error);
      toast({
        title: "Error",
        description: "Failed to mark course as completed",
        variant: "destructive",
      });
    }
  };

  const removeAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('course_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) {
        logger.error('Error removing assignment:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Assignment removed successfully",
      });

      await fetchAssignments();
    } catch (error) {
      logger.error('Error removing assignment:', error);
      toast({
        title: "Error",
        description: "Failed to remove assignment",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  return {
    assignments,
    loading,
    assignCourse,
    markCourseCompleted,
    removeAssignment,
    fetchAssignments
  };
};
