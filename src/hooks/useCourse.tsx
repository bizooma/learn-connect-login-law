
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";

type Course = Tables<'courses'>;
type Lesson = Tables<'lessons'>;
type Unit = Tables<'units'>;
type Quiz = Tables<'quizzes'>;

interface UnitWithQuiz extends Unit {
  quiz?: Quiz;
}

interface LessonWithUnits extends Lesson {
  units: UnitWithQuiz[];
}

interface CourseWithLessons extends Course {
  lessons: LessonWithUnits[];
}

export const useCourse = (id: string | undefined) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [course, setCourse] = useState<CourseWithLessons | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<UnitWithQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      try {
        console.log('Checking admin status for user:', user.id);
        const isAdminResult = await supabase.rpc('is_admin_user');
        console.log('Admin check result:', isAdminResult);
        setIsAdmin(isAdminResult.data || false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const fetchCourse = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching course:', id);
      
      // First fetch the course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (courseError) {
        console.error('Error fetching course:', courseError);
        throw courseError;
      }

      console.log('Course data fetched:', courseData);

      // Then fetch modules with lessons and units
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select(`
          *,
          lessons:lessons(
            *,
            units:units(
              *,
              quiz:quizzes(*)
            )
          )
        `)
        .eq('course_id', id)
        .order('sort_order', { ascending: true });

      if (modulesError) {
        console.error('Error fetching modules:', modulesError);
        throw modulesError;
      }

      console.log('Modules data fetched:', modulesData);

      // For backward compatibility, flatten lessons from the first module
      const firstModule = modulesData?.[0];
      const lessons = firstModule?.lessons?.map(lesson => ({
        ...lesson,
        units: (lesson.units || []).map(unit => ({
          ...unit,
          quiz: unit.quiz?.[0] || undefined
        })).sort((a, b) => a.sort_order - b.sort_order)
      })).sort((a, b) => a.sort_order - b.sort_order) || [];

      const courseWithLessons: CourseWithLessons = {
        ...courseData,
        lessons
      };

      setCourse(courseWithLessons);

      // Set first unit of first lesson as selected by default
      const firstLesson = lessons[0];
      if (firstLesson && firstLesson.units.length > 0) {
        setSelectedUnit(firstLesson.units[0]);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
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

  return {
    course,
    selectedUnit,
    setSelectedUnit,
    loading,
    isAdmin
  };
};
