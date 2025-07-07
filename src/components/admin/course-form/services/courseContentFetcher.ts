
import { supabase } from "@/integrations/supabase/client";
import { SectionData } from "../types";
import { Tables } from "@/integrations/supabase/types";
import { logger } from "@/utils/logger";

type Unit = Tables<'units'>;
type Lesson = Tables<'lessons'>;

// Determine video type based on URL
const getVideoType = (url: string): 'youtube' | 'upload' => {
  if (!url) return 'youtube';
  return url.includes('youtube.com') || url.includes('youtu.be') ? 'youtube' : 'upload';
};

// Parse files from database format
const parseFilesFromDatabase = (filesData: any): Array<{ url: string; name: string; size: number }> => {
  if (!filesData) return [];
  
  try {
    // Handle if it's already an array
    if (Array.isArray(filesData)) {
      return filesData.filter(file => file && file.url && file.name);
    }
    
    // Handle if it's a JSON string
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

export const fetchCourseContent = async (courseId: string): Promise<SectionData[]> => {
  try {
    logger.log('Fetching course content for course:', courseId);
    
    // Fetch modules with their lessons and units
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
      throw modulesError;
    }

    logger.log('Modules data fetched:', modulesData);

    // Collect all units from all lessons to fetch quizzes - exclude draft units
    const allUnits = modulesData?.flatMap(m => 
      m.lessons?.flatMap(l => l.units?.filter(u => !u.is_draft) || []) || []
    ) || [];
    
    // Fetch quiz assignments for all non-draft units - this is crucial for preserving assignments
    const { data: quizzesData, error: quizzesError } = await supabase
      .from('quizzes')
      .select('id, unit_id, title, description, passing_score, time_limit_minutes, is_active')
      .in('unit_id', allUnits.map(u => u.id))
      .eq('is_deleted', false);

    if (quizzesError) {
      logger.error('Error fetching quiz assignments:', quizzesError);
      throw quizzesError;
    }

    logger.log('Quiz assignments fetched:', quizzesData?.length || 0);

    // Create a map of unit_id to quiz_id for preserving assignments
    const unitQuizMap = new Map();
    quizzesData?.forEach(quiz => {
      if (quiz.unit_id) {
        unitQuizMap.set(quiz.unit_id, quiz.id);
        logger.log(`Preserving quiz assignment: Unit ${quiz.unit_id} -> Quiz ${quiz.id} (${quiz.title})`);
      }
    });

    // Convert modules/lessons structure to the flat lessons structure expected by the form
    // For backward compatibility, we'll flatten the first module's lessons
    const firstModule = modulesData?.[0];
    const formattedLessons: SectionData[] = firstModule?.lessons?.map((lesson: any) => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description || "",
      image_url: lesson.image_url || "",
      file_url: lesson.file_url || "",
      file_name: lesson.file_name || "",
      file_size: lesson.file_size || 0,
      video_url: lesson.video_url || "",
      video_type: getVideoType(lesson.video_url || "") as 'youtube' | 'upload',
      duration_minutes: lesson.duration_minutes || 0,
      sort_order: lesson.sort_order,
      units: (lesson.units || []).filter((unit: Unit) => !unit.is_draft).map((unit: Unit) => {
        // Parse files from the database
        const files = parseFilesFromDatabase(unit.files);
        
        logger.log('Unit files parsed:', unit.title, 'Files:', files);
        
        // Fallback to legacy single file format if no files array
        const finalFiles = files.length === 0 && unit.file_url ? [{
          url: unit.file_url,
          name: unit.file_name || 'Download File',
          size: unit.file_size || 0
        }] : files;

        // PRESERVE quiz assignment from the database
        const preservedQuizId = unitQuizMap.get(unit.id);
        if (preservedQuizId) {
          logger.log(`Preserving quiz assignment for unit "${unit.title}": Quiz ID ${preservedQuizId}`);
        }

        return {
          id: unit.id,
          title: unit.title,
          description: unit.description || "",
          content: unit.content || "",
          video_url: unit.video_url || "",
          video_type: getVideoType(unit.video_url || ""),
          duration_minutes: unit.duration_minutes || 0,
          sort_order: unit.sort_order,
          quiz_id: preservedQuizId, // CRITICAL: Preserve the quiz assignment
          image_url: "", // Units don't have image_url in the database yet
          file_url: unit.file_url || "",
          file_name: unit.file_name || "",
          file_size: unit.file_size || 0,
          files: finalFiles
        };
      }).sort((a, b) => a.sort_order - b.sort_order)
    })).sort((a, b) => a.sort_order - b.sort_order) || [];

    logger.log('Formatted lessons with preserved quiz assignments and filtered draft units:', formattedLessons);
    return formattedLessons;
  } catch (error) {
    logger.error('Error fetching course content:', error);
    return [];
  }
};
