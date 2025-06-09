
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { CourseFormData, ModuleData, LessonData, UnitData } from "./types";
import { useCourseForm } from "./hooks/useCourseForm";
import { createWelcomeCalendarEvent } from "./services/calendarService";
import { supabase } from "@/integrations/supabase/client";
import { performTransactionalCourseUpdate, validateTransactionResult } from "./services/transactionalCourseUpdate";

type Course = Tables<'courses'>;

const ensureCalendarExists = async (courseId: string) => {
  try {
    await createWelcomeCalendarEvent(courseId, 'Course Updated');
  } catch (error) {
    console.error('Error ensuring calendar exists:', error);
  }
};

const fetchExistingModules = async (courseId: string): Promise<ModuleData[]> => {
  try {
    console.log('Fetching existing modules for course:', courseId);
    
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
      console.error('Error fetching modules:', modulesError);
      return [];
    }

    console.log('Modules data fetched:', modulesData);

    // Collect all units to fetch quiz assignments
    const allUnits = modulesData?.flatMap(m => 
      m.lessons?.flatMap(l => l.units || []) || []
    ) || [];

    // CRITICAL: Fetch quiz assignments to preserve them
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
        console.log(`Preserving quiz assignment in edit form: Unit ${quiz.unit_id} -> Quiz ${quiz.id} (${quiz.title})`);
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

    // Transform the data to match our ModuleData interface
    const modules: ModuleData[] = modulesData?.map(module => ({
      id: module.id,
      title: module.title,
      description: module.description || '',
      image_url: module.image_url || '',
      file_url: module.file_url || '',
      file_name: module.file_name || '',
      file_size: module.file_size || 0,
      sort_order: module.sort_order,
      lessons: module.lessons?.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description || '',
        image_url: lesson.image_url || '',
        file_url: lesson.file_url || '',
        file_name: lesson.file_name || '',
        file_size: lesson.file_size || 0,
        sort_order: lesson.sort_order,
        units: lesson.units?.map(unit => {
          const files = parseFilesFromDatabase(unit.files);
          
          console.log('Unit files parsed in edit form:', unit.title, 'Files:', files);
          
          const finalFiles = files.length === 0 && unit.file_url ? [{
            url: unit.file_url,
            name: unit.file_name || 'Download File',
            size: unit.file_size || 0
          }] : files;

          // PRESERVE quiz assignment
          const preservedQuizId = unitQuizMap.get(unit.id);
          if (preservedQuizId) {
            console.log(`Preserving quiz assignment for unit "${unit.title}": Quiz ID ${preservedQuizId}`);
          }

          return {
            id: unit.id,
            title: unit.title,
            description: unit.description || '',
            content: unit.content || '',
            video_url: unit.video_url || '',
            video_type: (unit.video_url?.includes('youtube.com') || unit.video_url?.includes('youtu.be')) ? 'youtube' as const : 'upload' as const,
            duration_minutes: unit.duration_minutes || 0,
            sort_order: unit.sort_order,
            quiz_id: preservedQuizId, // CRITICAL: Preserve quiz assignment
            image_url: '',
            file_url: unit.file_url || '',
            file_name: unit.file_name || '',
            file_size: unit.file_size || 0,
            files: finalFiles
          } as UnitData;
        }).sort((a, b) => a.sort_order - b.sort_order) || []
      } as LessonData)).sort((a, b) => a.sort_order - b.sort_order) || []
    } as ModuleData)) || [];

    console.log('Modules with preserved quiz assignments:', modules);
    return modules;
  } catch (error) {
    console.error('Error fetching existing modules:', error);
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
      console.log('Starting enhanced course update with safety mechanisms');
      
      // Use the new transactional update service
      const updateResult = await performTransactionalCourseUpdate(course.id, data, modules);
      
      // Validate the transaction result
      const validation = validateTransactionResult(updateResult);
      
      if (updateResult.success && validation.isValid) {
        toast({
          title: "Success",
          description: `Course updated successfully. ${updateResult.quizAssignmentsRestored || 0} quiz assignments restored.`,
        });

        await ensureCalendarExists(course.id);
        onSuccess();
      } else {
        // Partial success or issues detected
        const errorMsg = updateResult.errors.length > 0 
          ? updateResult.errors.join(', ') 
          : 'Course update completed with issues';
          
        toast({
          title: validation.isValid ? "Warning" : "Error", 
          description: errorMsg,
          variant: validation.isValid ? "default" : "destructive",
        });

        if (validation.isValid) {
          // Still call success callback if no critical issues
          onSuccess();
        }
      }

      // Log warnings for debugging
      if (updateResult.warnings.length > 0) {
        console.warn('Update warnings:', updateResult.warnings);
      }

      // Log validation results
      if (validation.recommendations.length > 0) {
        console.info('Recommendations:', validation.recommendations);
      }

    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: "Error",
        description: "Failed to update course",
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
