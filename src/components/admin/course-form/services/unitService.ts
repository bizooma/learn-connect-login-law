
import { supabase } from "@/integrations/supabase/client";
import { UnitData } from "../types";
import { uploadVideoFile } from "../fileUploadUtils";

export const createUnit = async (sectionId: string, unit: UnitData) => {
  let videoUrl = unit.video_url;
  
  // Upload video file if it's an upload type and has a file
  if (unit.video_type === 'upload' && unit.video_file) {
    try {
      console.log('Uploading video for unit:', unit.title);
      videoUrl = await uploadVideoFile(unit.video_file);
    } catch (error) {
      console.error('Error uploading video:', error);
      throw new Error(`Failed to upload video for unit "${unit.title}": ${error.message}`);
    }
  }

  const { data: unitData, error: unitError } = await supabase
    .from('units')
    .insert({
      section_id: sectionId,
      title: unit.title,
      description: unit.description,
      content: unit.content,
      video_url: videoUrl || null,
      duration_minutes: unit.duration_minutes,
      sort_order: unit.sort_order,
    })
    .select()
    .single();

  if (unitError) {
    console.error('Error creating unit:', unitError);
    throw new Error(`Failed to create unit: ${unitError.message}`);
  }

  return unitData;
};

export const linkQuizToUnit = async (unitId: string, quizId: string) => {
  console.log('Linking quiz to unit. Quiz ID:', quizId);
  
  const { error: quizUpdateError } = await supabase
    .from('quizzes')
    .update({ unit_id: unitId })
    .eq('id', quizId);

  if (quizUpdateError) {
    console.error('Error linking quiz to unit:', quizUpdateError);
    throw new Error(`Failed to link quiz to unit: ${quizUpdateError.message}`);
  }
};
