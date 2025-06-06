
import { supabase } from "@/integrations/supabase/client";
import { SectionData } from "../types";
import { Tables } from "@/integrations/supabase/types";

type Unit = Tables<'units'>;
type Lesson = Tables<'lessons'>;

// Determine video type based on URL
const getVideoType = (url: string): 'youtube' | 'upload' => {
  if (!url) return 'youtube';
  return url.includes('youtube.com') || url.includes('youtu.be') ? 'youtube' : 'upload';
};

export const fetchCourseContent = async (courseId: string): Promise<SectionData[]> => {
  try {
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

    if (modulesError) throw modulesError;

    // Fetch quizzes for units
    const allUnits = modulesData?.flatMap(m => 
      m.lessons?.flatMap(l => (l.units as Unit[]) || []) || []
    ) || [];
    
    const { data: quizzesData, error: quizzesError } = await supabase
      .from('quizzes')
      .select('id, unit_id')
      .in('unit_id', allUnits.map(u => u.id));

    if (quizzesError) throw quizzesError;

    // Create a map of unit_id to quiz_id
    const unitQuizMap = new Map();
    quizzesData?.forEach(quiz => {
      if (quiz.unit_id) {
        unitQuizMap.set(quiz.unit_id, quiz.id);
      }
    });

    // Convert modules/lessons structure to the flat lessons structure expected by the form
    // For backward compatibility, we'll flatten the first module's lessons
    const firstModule = modulesData?.[0];
    const formattedLessons: SectionData[] = firstModule?.lessons?.map((lesson: Lesson) => ({
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
      units: (lesson.units as Unit[])?.map(unit => ({
        id: unit.id,
        title: unit.title,
        description: unit.description || "",
        content: unit.content || "",
        video_url: unit.video_url || "",
        video_type: getVideoType(unit.video_url || ""),
        duration_minutes: unit.duration_minutes || 0,
        sort_order: unit.sort_order,
        quiz_id: unitQuizMap.get(unit.id) || undefined,
        image_url: "", // Units don't have image_url in the database yet
        file_url: unit.file_url || "",
        file_name: unit.file_name || "",
        file_size: unit.file_size || 0,
      })).sort((a, b) => a.sort_order - b.sort_order) || []
    })).sort((a, b) => a.sort_order - b.sort_order) || [];

    return formattedLessons;
  } catch (error) {
    console.error('Error fetching course content:', error);
    return [];
  }
};
