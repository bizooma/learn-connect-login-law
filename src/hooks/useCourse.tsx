
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

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
  const [course, setCourse] = useState<CourseWithContent | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminStatus = async () => {
    try {
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      
      setIsAdmin(userRoles?.some(role => role.role === 'admin' || role.role === 'owner') || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const fetchCourse = async () => {
    try {
      // Fetch course with sections and units
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (courseError) throw courseError;

      // Fetch sections with units
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select(`
          *,
          units (*)
        `)
        .eq('course_id', id)
        .order('sort_order', { ascending: true });

      if (sectionsError) throw sectionsError;

      // Sort units within each section
      const sectionsWithSortedUnits = sectionsData.map(section => ({
        ...section,
        units: section.units.sort((a, b) => a.sort_order - b.sort_order)
      }));

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
      console.error('Error fetching course:', error);
      toast({
        title: "Error",
        description: "Failed to load course",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCourse();
      checkAdminStatus();
    }
  }, [id]);

  return {
    course,
    selectedUnit,
    setSelectedUnit,
    loading,
    isAdmin
  };
};
