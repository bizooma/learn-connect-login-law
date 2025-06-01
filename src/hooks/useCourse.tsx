
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";

type Course = Tables<'courses'>;
type Section = Tables<'sections'>;
type Unit = Tables<'units'>;

interface CourseWithContent extends Course {
  sections: (Section & {
    units: Unit[];
  })[];
}

export const useCourse = (id: string | undefined) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [course, setCourse] = useState<CourseWithContent | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  const checkAdminStatus = async () => {
    try {
      if (!user?.id) {
        console.log('useCourse: No user ID, setting admin to false');
        setIsAdmin(false);
        setAdminLoading(false);
        return;
      }

      console.log('useCourse: Checking admin status for user:', user.id);
      setAdminLoading(true);
      
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('useCourse: Error checking admin status:', error);
        setIsAdmin(false);
        setAdminLoading(false);
        return;
      }

      const hasAdminRole = userRoles?.some(role => role.role === 'admin' || role.role === 'owner') || false;
      console.log('useCourse: User roles found:', userRoles);
      console.log('useCourse: Admin status determined:', hasAdminRole);
      setIsAdmin(hasAdminRole);
      setAdminLoading(false);
    } catch (error) {
      console.error('useCourse: Error in checkAdminStatus:', error);
      setIsAdmin(false);
      setAdminLoading(false);
    }
  };

  const fetchCourse = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      console.log('useCourse: Fetching course:', id);
      
      // Fetch course with sections and units
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (courseError) {
        console.error('useCourse: Error fetching course:', courseError);
        throw courseError;
      }

      console.log('useCourse: Course data fetched:', courseData);

      // Fetch sections with units
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select(`
          *,
          units (*)
        `)
        .eq('course_id', id)
        .order('sort_order', { ascending: true });

      if (sectionsError) {
        console.error('useCourse: Error fetching sections:', sectionsError);
        throw sectionsError;
      }

      console.log('useCourse: Sections data fetched:', sectionsData);

      // Sort units within each section
      const sectionsWithSortedUnits = sectionsData?.map(section => ({
        ...section,
        units: (section.units || []).sort((a, b) => a.sort_order - b.sort_order)
      })) || [];

      const courseWithContent: CourseWithContent = {
        ...courseData,
        sections: sectionsWithSortedUnits
      };

      setCourse(courseWithContent);

      // Set first unit as selected by default
      if (sectionsWithSortedUnits.length > 0 && sectionsWithSortedUnits[0].units.length > 0) {
        setSelectedUnit(sectionsWithSortedUnits[0].units[0]);
      }
    } catch (error) {
      console.error('useCourse: Error fetching course:', error);
      toast({
        title: "Error",
        description: "Failed to load course",
        variant: "destructive",
      });
      setCourse(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      console.log('useCourse: Starting to fetch course:', id);
      fetchCourse();
    } else {
      console.log('useCourse: No course ID provided');
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    console.log('useCourse: User changed, checking admin status. User:', user?.id);
    checkAdminStatus();
  }, [user?.id]);

  console.log('useCourse: Returning values - isAdmin:', isAdmin, 'adminLoading:', adminLoading, 'loading:', loading);

  return {
    course,
    selectedUnit,
    setSelectedUnit,
    loading: loading || adminLoading,
    isAdmin
  };
};
