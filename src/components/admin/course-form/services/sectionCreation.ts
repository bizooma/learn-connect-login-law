
import { supabase } from "@/integrations/supabase/client";
import { uploadVideoFile } from "../fileUploadUtils";

interface UnitData {
  id?: string;
  title: string;
  description: string;
  content: string;
  video_url: string;
  video_type: 'youtube' | 'upload';
  video_file?: File;
  duration_minutes: number;
  sort_order: number;
  quiz_id?: string;
  image_url?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  files?: Array<{ url: string; name: string; size: number }>;
}

interface SectionData {
  id?: string;
  title: string;
  description: string;
  image_url?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  video_url?: string;
  video_type?: 'youtube' | 'upload';
  video_file?: File;
  duration_minutes?: number;
  sort_order: number;
  units: UnitData[];
}

export const createLessonsAndUnits = async (courseId: string, sections: SectionData[], moduleId?: string) => {
  console.log('Creating lessons and units:', { courseId, sections, moduleId });
  
  for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
    const section = sections[sectionIndex];
    
    console.log('Creating lesson:', section.title);
    
    let finalVideoUrl = section.video_url || '';
    
    // Handle lesson video file upload if present
    if (section.video_file && section.video_type === 'upload') {
      try {
        console.log('Uploading video file for lesson:', section.title);
        finalVideoUrl = await uploadVideoFile(section.video_file);
        console.log('Lesson video uploaded successfully:', finalVideoUrl);
      } catch (error) {
        console.error('Error uploading lesson video:', error);
        // Continue with empty video URL if upload fails
        finalVideoUrl = '';
      }
    }
    
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        course_id: courseId,
        module_id: moduleId || null,
        title: section.title,
        description: section.description || '',
        image_url: section.image_url || null,
        file_url: section.file_url || null,
        file_name: section.file_name || null,
        file_size: section.file_size || 0,
        video_url: finalVideoUrl || null,
        video_type: section.video_type || null,
        duration_minutes: section.duration_minutes || null,
        sort_order: section.sort_order || sectionIndex,
      })
      .select()
      .single();

    if (lessonError) {
      console.error('Error creating lesson:', lessonError);
      throw new Error(`Failed to create lesson: ${lessonError.message}`);
    }

    console.log('Lesson created:', lesson);

    // Create units for this lesson
    if (section.units && section.units.length > 0) {
      await createUnitsForLesson(lesson.id, section.units);
    }
  }
};

const createUnitsForLesson = async (lessonId: string, units: UnitData[]) => {
  console.log('Creating units for lesson:', lessonId);
  
  for (let unitIndex = 0; unitIndex < units.length; unitIndex++) {
    const unit = units[unitIndex];
    
    console.log('Creating unit:', unit.title);
    
    let finalVideoUrl = unit.video_url;
    
    // Handle video file upload if present
    if (unit.video_file && unit.video_type === 'upload') {
      try {
        console.log('Uploading video file for unit:', unit.title);
        finalVideoUrl = await uploadVideoFile(unit.video_file);
        console.log('Video uploaded successfully:', finalVideoUrl);
      } catch (error) {
        console.error('Error uploading video:', error);
        // Continue with empty video URL if upload fails
        finalVideoUrl = '';
      }
    }

    // Handle multiple files
    let filesData = null;
    if (unit.files && Array.isArray(unit.files) && unit.files.length > 0) {
      filesData = JSON.stringify(unit.files);
      console.log('Unit files to save:', unit.title, 'Files:', filesData);
    }

    const { data: createdUnit, error: unitError } = await supabase
      .from('units')
      .insert({
        section_id: lessonId,
        title: unit.title,
        description: unit.description || '',
        content: unit.content || '',
        video_url: finalVideoUrl || '',
        duration_minutes: unit.duration_minutes || 0,
        sort_order: unit.sort_order || unitIndex,
        file_url: unit.file_url || null,
        file_name: unit.file_name || null,
        file_size: unit.file_size || 0,
        files: filesData,
      })
      .select()
      .single();

    if (unitError) {
      console.error('Error creating unit:', unitError);
      throw new Error(`Failed to create unit: ${unitError.message}`);
    }

    console.log('Unit created with files:', createdUnit);

    // Link quiz if provided
    if (unit.quiz_id) {
      const { error: quizLinkError } = await supabase
        .from('quizzes')
        .update({ unit_id: createdUnit.id })
        .eq('id', unit.quiz_id);

      if (quizLinkError) {
        console.error('Error linking quiz to unit:', quizLinkError);
      }
    }
  }
};
