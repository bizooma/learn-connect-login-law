
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { CourseFormData, ModuleData, LessonData, UnitData } from "./types";
import { useCourseForm } from "./useCourseForm";
import { createWelcomeCalendarEvent } from "./services/calendarService";
import { supabase } from "@/integrations/supabase/client";
import { performSafeCourseUpdate } from "./services/safeCourseUpdateService";
import { logger } from "@/utils/logger";

type Course = Tables<'courses'>;

const ensureCalendarExists = async (courseId: string) => {
  try {
    await createWelcomeCalendarEvent(courseId, 'Course Updated');
  } catch (error) {
    logger.error('Error ensuring calendar exists:', error);
  }
};

const fetchExistingModules = async (courseId: string): Promise<ModuleData[]> => {
  try {
    logger.log('Fetching existing modules for course:', courseId);
    
    const { data: modulesData, error: modulesError } = await supabase
      .from('modules')
      .select(`
        *,
        lessons:lessons(
          *,
          units:units(*)
        )
      `)
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true });

    if (modulesError) {
      logger.error('Error fetching modules:', modulesError);
      return [];
    }

    logger.log('Modules data fetched:', modulesData);

    // Apply ordering to nested relations since Supabase doesn't support nested ordering in select
    const orderedModulesData = modulesData?.map(module => ({
      ...module,
      lessons: module.lessons
        ?.sort((a, b) => (a.sort_order !== null && a.sort_order !== undefined ? a.sort_order : 0) - 
                         (b.sort_order !== null && b.sort_order !== undefined ? b.sort_order : 0))
        ?.map(lesson => ({
          ...lesson,
          units: lesson.units?.sort((a, b) => (a.sort_order !== null && a.sort_order !== undefined ? a.sort_order : 0) - 
                                             (b.sort_order !== null && b.sort_order !== undefined ? b.sort_order : 0))
        }))
    }));

    // Collect all units to fetch quiz assignments
    const allUnits = orderedModulesData?.flatMap(m => 
      m.lessons?.flatMap(l => l.units || []) || []
    ) || [];

    // CRITICAL: Fetch quiz assignments to preserve them
    const { data: quizzesData, error: quizzesError } = await supabase
      .from('quizzes')
      .select('id, unit_id, title')
      .in('unit_id', allUnits.map(u => u.id))
      .eq('is_deleted', false);

    if (quizzesError) {
      logger.error('Error fetching quiz assignments:', quizzesError);
    }

    // Create a map of unit_id to quiz_id
    const unitQuizMap = new Map();
    quizzesData?.forEach(quiz => {
      if (quiz.unit_id) {
        unitQuizMap.set(quiz.unit_id, quiz.id);
        logger.log(`Preserving quiz assignment in edit form: Unit ${quiz.unit_id} -> Quiz ${quiz.id} (${quiz.title})`);
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
        logger.error('Error parsing files data:', error, filesData);
        return [];
      }
    };

    // Transform the data to match our ModuleData interface - using pre-ordered data
    const modules: ModuleData[] = orderedModulesData?.map((module, moduleIndex) => ({
      id: module.id,
      title: module.title,
      description: module.description || '',
      image_url: module.image_url || '',
      file_url: module.file_url || '',
      file_name: module.file_name || '',
      file_size: module.file_size || 0,
      sort_order: module.sort_order !== null && module.sort_order !== undefined ? module.sort_order : moduleIndex,
      lessons: module.lessons?.map((lesson, lessonIndex) => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description || '',
        image_url: lesson.image_url || '',
        file_url: lesson.file_url || '',
        file_name: lesson.file_name || '',
        file_size: lesson.file_size || 0,
        sort_order: lesson.sort_order !== null && lesson.sort_order !== undefined ? lesson.sort_order : lessonIndex,
        units: lesson.units?.map((unit, unitIndex) => {
          const files = parseFilesFromDatabase(unit.files);
          
          logger.log('Unit files parsed in edit form:', unit.title, 'Files:', files);
          
          const finalFiles = files.length === 0 && unit.file_url ? [{
            url: unit.file_url,
            name: unit.file_name || 'Download File',
            size: unit.file_size || 0
          }] : files;

          // PRESERVE quiz assignment - FIX: Properly handle undefined values
          const preservedQuizId = unitQuizMap.get(unit.id);
          if (preservedQuizId) {
            logger.log(`Preserving quiz assignment for unit "${unit.title}": Quiz ID ${preservedQuizId}`);
          }

          return {
            id: unit.id,
            title: unit.title,
            description: unit.description || '',
            content: unit.content || '',
            video_url: unit.video_url || '',
            video_type: (unit.video_url?.includes('youtube.com') || unit.video_url?.includes('youtu.be')) ? 'youtube' as const : 'upload' as const,
            duration_minutes: unit.duration_minutes || 0,
            sort_order: unit.sort_order !== null && unit.sort_order !== undefined ? unit.sort_order : unitIndex,
            quiz_id: preservedQuizId || undefined, // CRITICAL FIX: Use undefined instead of complex object
            image_url: '',
            file_url: unit.file_url || '',
            file_name: unit.file_name || '',
            file_size: unit.file_size || 0,
            files: finalFiles
          } as UnitData;
        }) || []
      } as LessonData)) || []
    } as ModuleData)) || [];

    logger.log('Modules with preserved quiz assignments:', modules);
    return modules;
  } catch (error) {
    logger.error('Error fetching existing modules:', error);
    return [];
  }
};

export const useEditCourseForm = (course: Course | null, open: boolean, onSuccess: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modules, setModules] = useState<ModuleData[]>([]);
  const { toast } = useToast();
  
  const form = useCourseForm(course, open);

  // Load existing modules when the form opens
  useEffect(() => {
    if (course && open) {
      console.log('Loading existing modules for course:', course.id);
      fetchExistingModules(course.id).then(existingModules => {
        console.log('Setting modules with preserved quiz assignments:', existingModules);
        setModules(existingModules);
      });
    } else {
      setModules([]);
    }
  }, [course, open]);

  const onSubmit = async (data: CourseFormData) => {
    if (!course) return;
    
    setIsSubmitting(true);
    try {
      console.log('🛡️ Starting SAFE course update - NO DATA WILL BE LOST');
      
      // Use the new SAFE update service that preserves all data
      const updateResult = await performSafeCourseUpdate(course.id, data, modules);
      
      if (updateResult.success) {
        // Show detailed success message
        const successDetails = [
          `Course updated safely - NO data lost!`,
          `Items updated: ${updateResult.itemsUpdated}`,
          `Items created: ${updateResult.itemsCreated}`,
          `Items preserved: ${updateResult.itemsPreserved}`,
          `Performance: ${updateResult.performanceMetrics?.totalDurationMs || 0}ms`
        ].join('\n');

        toast({
          title: "✅ SAFE Update Successful - Zero Data Loss!",
          description: successDetails,
        });

        // Log performance summary
        if (updateResult.performanceMetrics) {
          console.log('📊 SAFE Update Performance Summary:', updateResult.performanceMetrics);
        }

        await ensureCalendarExists(course.id);
        onSuccess();
      } else {
        // Enhanced error handling with detailed information
        const errorDetails = [
          'Course update completed with issues:',
          ...updateResult.errors.slice(0, 3), // Show first 3 errors
          updateResult.errors.length > 3 ? `...and ${updateResult.errors.length - 3} more errors` : ''
        ].filter(Boolean).join('\n');
          
        toast({
          title: "⚠️ Update Issues Detected", 
          description: errorDetails,
          variant: "destructive",
        });
      }

      // Log comprehensive warnings for debugging
      if (updateResult.warnings.length > 0) {
        console.warn('⚠️ Update warnings:', updateResult.warnings);
      }

    } catch (error) {
      console.error('💥 Critical error updating course:', error);
      toast({
        title: "🚨 Critical Error",
        description: "Course update failed completely. Your data has been preserved. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isSubmitting,
    modules,
    setModules,
    onSubmit,
  };
};
