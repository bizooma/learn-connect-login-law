
import { supabase } from "@/integrations/supabase/client";
import { SectionData } from "../types";
import { uploadVideoFile } from "../fileUploadUtils";

export const createSectionsAndUnits = async (courseId: string, sections: SectionData[]) => {
  if (sections.length === 0) return;

  // First, create a default module for the course if sections exist
  const { data: moduleData, error: moduleError } = await supabase
    .from('modules')
    .insert({
      course_id: courseId,
      title: 'Main Module',
      description: 'Primary course content',
      sort_order: 0,
    })
    .select()
    .single();

  if (moduleError) {
    console.error('Error creating default module:', moduleError);
    throw new Error(`Failed to create default module: ${moduleError.message}`);
  }

  for (const section of sections) {
    console.log('Creating section:', section.title);
    
    const { data: sectionData, error: sectionError } = await supabase
      .from('sections')
      .insert({
        course_id: courseId,
        module_id: moduleData.id,
        title: section.title,
        description: section.description,
        sort_order: section.sort_order,
      })
      .select()
      .single();

    if (sectionError) {
      console.error('Error creating section:', sectionError);
      throw new Error(`Failed to create section: ${sectionError.message}`);
    }

    // Create units for this section
    if (section.units.length > 0) {
      for (const unit of section.units) {
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
            section_id: sectionData.id,
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

        // Link existing quiz to this unit if quiz_id is provided
        if (unit.quiz_id) {
          console.log('Linking quiz to unit:', unit.title, 'Quiz ID:', unit.quiz_id);
          
          const { error: quizUpdateError } = await supabase
            .from('quizzes')
            .update({ unit_id: unitData.id })
            .eq('id', unit.quiz_id);

          if (quizUpdateError) {
            console.error('Error linking quiz to unit:', quizUpdateError);
            throw new Error(`Failed to link quiz to unit: ${quizUpdateError.message}`);
          }
        }
      }
    }
  }
};
