
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { CourseFormData, ModuleData } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { performSafeCourseUpdate } from "../services/safeCourseUpdateService";
import { createCourse } from "../services/courseCreation";

export const useCourseForm = (courseId?: string) => {
  const [courseData, setCourseData] = useState<CourseFormData>({
    title: "",
    description: "",
    instructor: "",
    category: "",
    level: "",
    duration: "",
  });
  
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Load existing course data for editing
  useEffect(() => {
    if (courseId) {
      loadCourseData(courseId);
    }
  }, [courseId]);

  const loadCourseData = async (id: string) => {
    try {
      setLoading(true);
      
      // Fetch course basic info
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (courseError) throw courseError;

      // Set course data
      setCourseData({
        title: course.title,
        description: course.description || "",
        instructor: course.instructor,
        category: course.category,
        level: course.level,
        duration: course.duration,
        image_url: course.image_url,
      });

      // Fetch course structure
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select(`
          *,
          lessons:lessons(
            *,
            units:units(*)
          )
        `)
        .eq('course_id', id)
        .order('sort_order', { ascending: true });

      if (modulesError) throw modulesError;

      // Transform data to match form structure
      const transformedModules = modulesData?.map((module, index) => ({
        id: module.id,
        title: module.title,
        description: module.description || "",
        image_url: module.image_url,
        sort_order: module.sort_order || index,
        lessons: module.lessons?.map((lesson, lessonIndex) => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description || "",
          image_url: lesson.image_url,
          sort_order: lesson.sort_order || lessonIndex,
          units: lesson.units?.map((unit, unitIndex) => ({
            id: unit.id,
            title: unit.title,
            description: unit.description || "",
            content: unit.content || "",
            video_url: unit.video_url || "",
            video_type: (unit.video_url?.includes('youtube.com') || unit.video_url?.includes('youtu.be')) ? 'youtube' as const : 'upload' as const,
            duration_minutes: unit.duration_minutes || 0,
            sort_order: unit.sort_order || unitIndex,
            quiz_id: unit.quiz_id,
            image_url: unit.image_url,
            file_url: unit.file_url,
            file_name: unit.file_name,
            file_size: unit.file_size,
            files: unit.files || [],
          })) || []
        })) || []
      })) || [];

      setModules(transformedModules);

    } catch (error: any) {
      console.error('Error loading course data:', error);
      toast({
        title: "Error",
        description: `Failed to load course data: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveCourse = async (isDraft: boolean = false) => {
    try {
      setSaving(true);
      
      if (courseId) {
        // Update existing course using safe update service
        console.log('🔄 Updating existing course with quiz preservation...');
        
        const result = await performSafeCourseUpdate(courseId, courseData, modules);
        
        if (result.success) {
          toast({
            title: "Success",
            description: `Course updated successfully! ${result.quizAssignmentsRestored || 0} quiz assignments preserved.`,
          });
          
          // Log detailed results
          console.log('✅ Course update completed:', {
            itemsUpdated: result.itemsUpdated,
            itemsCreated: result.itemsCreated,
            itemsPreserved: result.itemsPreserved,
            quizAssignmentsPreserved: result.quizAssignmentsPreserved,
            quizAssignmentsRestored: result.quizAssignmentsRestored,
            warnings: result.warnings,
            performanceMetrics: result.performanceMetrics
          });
          
          if (result.warnings.length > 0) {
            console.warn('⚠️ Course update warnings:', result.warnings);
          }
          
          return result.courseId;
        } else {
          throw new Error(result.errors.join(', '));
        }
      } else {
        // Create new course
        console.log('🆕 Creating new course...');
        
        const newCourseId = await createCourse(courseData, modules, isDraft);
        
        toast({
          title: "Success",
          description: "Course created successfully!",
        });
        
        return newCourseId;
      }
    } catch (error: any) {
      console.error('Error saving course:', error);
      toast({
        title: "Error",
        description: `Failed to save course: ${error.message}`,
        variant: "destructive",
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const updateCourseData = (data: Partial<CourseFormData>) => {
    setCourseData(prev => ({ ...prev, ...data }));
  };

  const updateModules = (newModules: ModuleData[]) => {
    setModules(newModules);
  };

  return {
    courseData,
    modules,
    loading,
    saving,
    updateCourseData,
    updateModules,
    saveCourse,
    loadCourseData
  };
};
