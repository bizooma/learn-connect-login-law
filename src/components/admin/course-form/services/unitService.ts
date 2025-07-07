
import { supabase } from "@/integrations/supabase/client";
import { UnitData } from "../types";
import { uploadVideoFile } from "../fileUploadUtils";
import { logger } from "@/utils/logger";

export const createUnit = async (lessonId: string, unit: UnitData) => {
  let videoUrl = unit.video_url;
  
  // Upload video file if it's an upload type and has a file
  if (unit.video_type === 'upload' && unit.video_file) {
    try {
      logger.log('Uploading video for unit:', unit.title);
      videoUrl = await uploadVideoFile(unit.video_file);
    } catch (error) {
      logger.error('Error uploading video:', error);
      throw new Error(`Failed to upload video for unit "${unit.title}": ${error.message}`);
    }
  }

  // Handle multiple files properly
  let filesData = null;
  if (unit.files && Array.isArray(unit.files) && unit.files.length > 0) {
    filesData = JSON.stringify(unit.files);
    logger.log('Saving files data for unit:', unit.title, 'Files:', filesData);
  }

  const { data: unitData, error: unitError } = await supabase
    .from('units')
    .insert({
      section_id: lessonId,
      title: unit.title,
      description: unit.description,
      content: unit.content,
      video_url: videoUrl || null,
      duration_minutes: unit.duration_minutes,
      sort_order: unit.sort_order,
      file_url: unit.file_url || null,
      file_name: unit.file_name || null,
      file_size: unit.file_size || null,
      files: filesData,
    })
    .select()
    .single();

  if (unitError) {
    logger.error('Error creating unit:', unitError);
    throw new Error(`Failed to create unit: ${unitError.message}`);
  }

  // Link quiz to unit if quiz_id is provided
  if (unit.quiz_id) {
    await linkQuizToUnit(unitData.id, unit.quiz_id);
  }

  return unitData;
};

export const updateUnit = async (unitId: string, unit: UnitData) => {
  let videoUrl = unit.video_url;
  
  // Upload video file if it's an upload type and has a file
  if (unit.video_type === 'upload' && unit.video_file) {
    try {
      logger.log('Uploading video for unit:', unit.title);
      videoUrl = await uploadVideoFile(unit.video_file);
    } catch (error) {
      logger.error('Error uploading video:', error);
      throw new Error(`Failed to upload video for unit "${unit.title}": ${error.message}`);
    }
  }

  // Handle multiple files properly
  let filesData = null;
  if (unit.files && Array.isArray(unit.files) && unit.files.length > 0) {
    filesData = JSON.stringify(unit.files);
    logger.log('Updating files data for unit:', unit.title, 'Files:', filesData);
  } else {
    // If no files, explicitly set to null
    filesData = null;
  }

  const { data: unitData, error: unitError } = await supabase
    .from('units')
    .update({
      title: unit.title,
      description: unit.description,
      content: unit.content,
      video_url: videoUrl || null,
      duration_minutes: unit.duration_minutes,
      sort_order: unit.sort_order,
      file_url: unit.file_url || null,
      file_name: unit.file_name || null,
      file_size: unit.file_size || null,
      files: filesData,
    })
    .eq('id', unitId)
    .select()
    .single();

  if (unitError) {
    logger.error('Error updating unit:', unitError);
    throw new Error(`Failed to update unit: ${unitError.message}`);
  }

  // Handle quiz linking/unlinking
  if (unit.quiz_id) {
    await linkQuizToUnit(unitData.id, unit.quiz_id);
  } else {
    await unlinkQuizFromUnit(unitData.id);
  }

  return unitData;
};

export const linkQuizToUnit = async (unitId: string, quizId: string) => {
  logger.log('Linking quiz to unit. Quiz ID:', quizId, 'Unit ID:', unitId);
  
  const { error: quizUpdateError } = await supabase
    .from('quizzes')
    .update({ unit_id: unitId })
    .eq('id', quizId);

  if (quizUpdateError) {
    logger.error('Error linking quiz to unit:', quizUpdateError);
    throw new Error(`Failed to link quiz to unit: ${quizUpdateError.message}`);
  }
  
  logger.log('Quiz successfully linked to unit');
};

export const unlinkQuizFromUnit = async (unitId: string) => {
  logger.log('Unlinking quizzes from unit:', unitId);
  
  const { error: quizUpdateError } = await supabase
    .from('quizzes')
    .update({ unit_id: null })
    .eq('unit_id', unitId);

  if (quizUpdateError) {
    logger.error('Error unlinking quizzes from unit:', quizUpdateError);
    throw new Error(`Failed to unlink quizzes from unit: ${quizUpdateError.message}`);
  }
  
  logger.log('Quizzes successfully unlinked from unit');
};
