
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
  const { hasAdminPrivileges, loading: roleLoading } = useUserRole();
  const [course, setCourse] = useState<CourseWithContent | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('useCourse: Using useUserRole - hasAdminPrivileges:', hasAdminPrivileges, 'roleLoading:', roleLoading);

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

  console.log('useCourse: Returning values - hasAdminPrivileges:', hasAdminPrivileges, 'loading:', loading || roleLoading);

  return {
    course,
    selectedUnit,
    setSelectedUnit,
    loading: loading || roleLoading,
    isAdmin: hasAdminPrivileges
  };
};
