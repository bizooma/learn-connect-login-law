import { supabase } from "@/integrations/supabase/client";
import { CourseFormData, ModuleData } from "../types";
import { uploadImageFile, uploadVideoFile } from "../fileUploadUtils";
import { createMultipleFileUpload } from "./fileUploadService";
import { logger } from "@/utils/logger";

export const createCourseWithModules = async (
  courseId: string,
  courseData: CourseFormData,
  modules: ModuleData[]
) => {
  logger.log('Creating course with modules structure, preserving quiz assignments');

  for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
    const module = modules[moduleIndex];
    
    let moduleImageUrl = module.image_url;
    let moduleFileUrl = module.file_url;
    let moduleFileName = module.file_name;
    let moduleFileSize = module.file_size;

    // Handle module image upload
    if (module.image_file) {
      try {
        moduleImageUrl = await uploadImageFile(module.image_file);
      } catch (error) {
        logger.error('Error uploading module image:', error);
      }
    }

    // Handle module file upload
    if (module.file) {
      try {
        moduleFileUrl = await uploadVideoFile(module.file);
        moduleFileName = module.file.name;
        moduleFileSize = module.file.size;
      } catch (error) {
        logger.error('Error uploading module file:', error);
      }
    }

    // Create module
    const { data: createdModule, error: moduleError } = await supabase
      .from('modules')
      .insert({
        course_id: courseId,
        title: module.title,
        description: module.description,
        image_url: moduleImageUrl,
        file_url: moduleFileUrl,
        file_name: moduleFileName,
        file_size: moduleFileSize,
        sort_order: moduleIndex,
      })
      .select()
      .single();

    if (moduleError) {
      logger.error('Error creating module:', moduleError);
      throw new Error(`Failed to create module: ${moduleError.message}`);
    }

    logger.log('Module created:', createdModule);

    // Create lessons for this module
    for (let lessonIndex = 0; lessonIndex < module.lessons.length; lessonIndex++) {
      const lesson = module.lessons[lessonIndex];
      
      let lessonImageUrl = lesson.image_url;
      let lessonFileUrl = lesson.file_url;
      let lessonFileName = lesson.file_name;
      let lessonFileSize = lesson.file_size;

      // Handle lesson image upload
      if (lesson.image_file) {
        try {
          lessonImageUrl = await uploadImageFile(lesson.image_file);
        } catch (error) {
          logger.error('Error uploading lesson image:', error);
        }
      }

      // Handle lesson file upload
      if (lesson.file) {
        try {
          lessonFileUrl = await uploadVideoFile(lesson.file);
          lessonFileName = lesson.file.name;
          lessonFileSize = lesson.file.size;
        } catch (error) {
          logger.error('Error uploading lesson file:', error);
        }
      }

      // Create lesson
      const { data: createdLesson, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          course_id: courseId,
          module_id: createdModule.id,
          title: lesson.title,
          description: lesson.description,
          image_url: lessonImageUrl,
          file_url: lessonFileUrl,
          file_name: lessonFileName,
          file_size: lessonFileSize,
          sort_order: lessonIndex,
        })
        .select()
        .single();

      if (lessonError) {
        logger.error('Error creating lesson:', lessonError);
        throw new Error(`Failed to create lesson: ${lessonError.message}`);
      }

      logger.log('Lesson created:', createdLesson);

      // Create units for this lesson
      for (let unitIndex = 0; unitIndex < lesson.units.length; unitIndex++) {
        const unit = lesson.units[unitIndex];
        
        let unitVideoUrl = unit.video_url;
        let unitFileUrl = unit.file_url;
        let unitFileName = unit.file_name;
        let unitFileSize = unit.file_size;

        // Handle unit video upload
        if (unit.video_file) {
          try {
            unitVideoUrl = await uploadVideoFile(unit.video_file);
          } catch (error) {
            logger.error('Error uploading unit video:', error);
          }
        }

        // Handle unit file upload (legacy single file)
        if (unit.file) {
          try {
            unitFileUrl = await uploadVideoFile(unit.file);
            unitFileName = unit.file.name;
            unitFileSize = unit.file.size;
          } catch (error) {
            logger.error('Error uploading unit file:', error);
          }
        }

        // Handle multiple files upload
        let processedFiles = unit.files || [];
        if (unit.newFiles && unit.newFiles.length > 0) {
          try {
            const uploadedFiles = await createMultipleFileUpload(unit.newFiles, 'unit', unitIndex);
            processedFiles = [...processedFiles, ...uploadedFiles];
          } catch (error) {
            logger.error('Error uploading multiple unit files:', error);
          }
        }

        // Create unit
        const { data: createdUnit, error: unitError } = await supabase
          .from('units')
          .insert({
            section_id: createdLesson.id,
            title: unit.title,
            description: unit.description,
            content: unit.content,
            video_url: unitVideoUrl,
            duration_minutes: unit.duration_minutes,
            file_url: unitFileUrl,
            file_name: unitFileName,
            file_size: unitFileSize,
            files: processedFiles.length > 0 ? JSON.stringify(processedFiles) : null,
            sort_order: unitIndex,
          })
          .select()
          .single();

        if (unitError) {
          logger.error('Error creating unit:', unitError);
          throw new Error(`Failed to create unit: ${unitError.message}`);
        }

        console.log('Unit created:', createdUnit);

        // RESTORE QUIZ ASSIGNMENT if it exists
        if (unit.quiz_id) {
          console.log(`Restoring quiz assignment: Quiz ${unit.quiz_id} -> Unit ${createdUnit.id} (${unit.title})`);
          
          const { error: quizUpdateError } = await supabase
            .from('quizzes')
            .update({ unit_id: createdUnit.id })
            .eq('id', unit.quiz_id);

          if (quizUpdateError) {
            console.error(`Error restoring quiz assignment for unit ${unit.title}:`, quizUpdateError);
          } else {
            console.log(`Successfully restored quiz assignment: Quiz ${unit.quiz_id} -> Unit ${createdUnit.id}`);
          }
        }
      }
    }
  }

  console.log('Course creation with modules completed, quiz assignments restored');
};
