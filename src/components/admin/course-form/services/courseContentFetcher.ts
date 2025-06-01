
import { supabase } from "@/integrations/supabase/client";
import { SectionData } from "../types";
import { Tables } from "@/integrations/supabase/types";

type Unit = Tables<'units'>;

// Determine video type based on URL
const getVideoType = (url: string): 'youtube' | 'upload' => {
  if (!url) return 'youtube';
  return url.includes('youtube.com') || url.includes('youtu.be') ? 'youtube' : 'upload';
};

export const fetchCourseContent = async (courseId: string): Promise<SectionData[]> => {
  try {
    // Fetch modules with their sections and units
    const { data: modulesData, error: modulesError } = await supabase
      .from('modules')
      .select(`
        *,
        sections:sections(
          *,
          units:units(*)
        )
      `)
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true });

    if (modulesError) throw modulesError;

    // Fetch quizzes for units
    const allUnits = modulesData?.flatMap(m => 
      m.sections?.flatMap(s => (s.units as Unit[]) || []) || []
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

    // Convert modules/sections structure to the flat sections structure expected by the form
    // For backward compatibility, we'll flatten the first module's sections
    const firstModule = modulesData?.[0];
    const formattedSections: SectionData[] = firstModule?.sections?.map(section => ({
      id: section.id,
      title: section.title,
      description: section.description || "",
      image_url: section.image_url || "",
      sort_order: section.sort_order,
      units: (section.units as Unit[])?.map(unit => ({
        id: unit.id,
        title: unit.title,
        description: unit.description || "",
        content: unit.content || "",
        video_url: unit.video_url || "",
        video_type: getVideoType(unit.video_url || ""),
        duration_minutes: unit.duration_minutes || 0,
        sort_order: unit.sort_order,
        quiz_id: unitQuizMap.get(unit.id) || undefined,
      })).sort((a, b) => a.sort_order - b.sort_order) || []
    })).sort((a, b) => a.sort_order - b.sort_order) || [];

    return formattedSections;
  } catch (error) {
    console.error('Error fetching course content:', error);
    return [];
  }
};
