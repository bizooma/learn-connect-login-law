
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
    image_url: "",
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
        image_url: course.image_url || "",
      });

      // Fetch course structure with quiz assignments
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

      // Collect all units to fetch quiz assignments
      const allUnits = modulesData?.flatMap(m => 
        m.lessons?.flatMap(l => l.units || []) || []
      ) || [];

      // Fetch quiz assignments for all units
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quizzes')
        .select('id, unit_id, title')
        .in('unit_id', allUnits.map(u => u.id))
        .eq('is_deleted', false);

      if (quizzesError) {
        console.error('Error fetching quiz assignments:', quizzesError);
      }

      // Create a map of unit_id to quiz_id
      const unitQuizMap = new Map();
      quizzesData?.forEach(quiz => {
        if (quiz.unit_id) {
          unitQuizMap.set(quiz.unit_id, quiz.id);
          console.log(`Preserving quiz assignment: Unit ${quiz.unit_id} -> Quiz ${quiz.id} (${quiz.title})`);
        }
      });

      // Parse files from database format
      const parseFilesFromDatabase = (filesData: any): Array<{ url: string; name: string; size: number }> => {
        if (!filesData) return [];
        
        try {
          if (Array.isArray(filesData)) {
            return filesData.filter(file => file && file.url && file.name);
          }
          
          if (typeof filesData === 'string') {
            const parsed = JSON.parse(filesData);
            return Array.isArray(parsed) ? parsed.filter(file => file && file.url && file.name) : [];
          }
          
          return [];
        } catch (error) {
          console.error('Error parsing files data:', error, filesData);
          return [];
        }
      };

      // Transform data to match form structure
      const transformedModules: ModuleData[] = modulesData?.map((module, index) => ({
        id: module.id,
        title: module.title,
        description: module.description || "",
        image_url: module.image_url || "",
        file_url: module.file_url || "",
        file_name: module.file_name || "",
        file_size: module.file_size || 0,
        sort_order: module.sort_order || index,
        lessons: module.lessons?.map((lesson, lessonIndex) => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description || "",
          image_url: lesson.image_url || "",
          file_url: lesson.file_url || "",
          file_name: lesson.file_name || "",
          file_size: lesson.file_size || 0,
          sort_order: lesson.sort_order || lessonIndex,
          units: lesson.units?.map((unit, unitIndex) => {
            const files = parseFilesFromDatabase(unit.files);
            
            console.log('Unit files parsed:', unit.title, 'Files:', files);
            
            const finalFiles = files.length === 0 && unit.file_url ? [{
              url: unit.file_url,
              name: unit.file_name || 'Download File',
              size: unit.file_size || 0
            }] : files;

            // Preserve quiz assignment
            const preservedQuizId = unitQuizMap.get(unit.id);
            if (preservedQuizId) {
              console.log(`Preserving quiz assignment for unit "${unit.title}": Quiz ID ${preservedQuizId}`);
            }

            return {
              id: unit.id,
              title: unit.title,
              description: unit.description || "",
              content: unit.content || "",
              video_url: unit.video_url || "",
              video_type: (unit.video_url?.includes('youtube.com') || unit.video_url?.includes('youtu.be')) ? 'youtube' as const : 'upload' as const,
              duration_minutes: unit.duration_minutes || 0,
              sort_order: unit.sort_order || unitIndex,
              quiz_id: preservedQuizId,
              image_url: "",
              file_url: unit.file_url || "",
              file_name: unit.file_name || "",
              file_size: unit.file_size || 0,
              files: finalFiles
            };
          }).sort((a, b) => a.sort_order - b.sort_order) || []
        })).sort((a, b) => a.sort_order - b.sort_order) || []
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
