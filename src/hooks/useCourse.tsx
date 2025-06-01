
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

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
  const { hasAdminPrivileges, loading: roleLoading, refreshRole } = useUserRole();
  const [course, setCourse] = useState<CourseWithContent | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);

  // Debug log to see current admin status
  console.log('useCourse: hasAdminPrivileges:', hasAdminPrivileges, 'roleLoading:', roleLoading, 'user:', user?.id);

  // Force a role refresh when component mounts
  useEffect(() => {
    console.log('useCourse: Component mounted, forcing role refresh');
    if (user) {
      refreshRole();
    }
  }, [user, refreshRole]);

  const fetchCourse = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
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
      fetchCourse();
    } else {
      setLoading(false);
    }
  }, [id]);

  console.log('useCourse: Returning isAdmin:', hasAdminPrivileges);

  return {
    course,
    selectedUnit,
    setSelectedUnit,
    loading: loading || roleLoading,
    isAdmin: hasAdminPrivileges
  };
};
