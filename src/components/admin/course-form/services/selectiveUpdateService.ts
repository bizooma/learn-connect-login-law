import { supabase } from "@/integrations/supabase/client";
import { ModuleData } from "../types";
import { uploadImageFile, uploadVideoFile } from "../fileUploadUtils";
import { createMultipleFileUpload } from "./fileUploadService";

export const shouldUseSelectiveUpdate = (modules: ModuleData[]): boolean => {
  // Use selective update if we have existing IDs (indicating this is an edit)
  return modules.some(module => 
    module.id || 
    module.lessons.some(lesson => 
      lesson.id || 
      lesson.units.some(unit => unit.id)
    )
  );
};

export const performSelectiveUpdate = async (courseId: string, modules: ModuleData[]) => {
  console.log('Performing selective update with quiz assignment preservation');

  for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
    const module = modules[moduleIndex];
    
    let moduleData: any = {
      course_id: courseId,
      title: module.title,
      description: module.description,
      sort_order: moduleIndex,
    };

    // Handle module image upload
    if (module.image_file) {
      try {
        moduleData.image_url = await uploadImageFile(module.image_file);
      } catch (error) {
        console.error('Error uploading module image:', error);
      }
    } else if (module.image_url) {
      moduleData.image_url = module.image_url;
    }

    // Handle module file upload
    if (module.file) {
      try {
        moduleData.file_url = await uploadVideoFile(module.file);
        moduleData.file_name = module.file.name;
        moduleData.file_size = module.file.size;
      } catch (error) {
        console.error('Error uploading module file:', error);
      }
    } else {
      moduleData.file_url = module.file_url;
      moduleData.file_name = module.file_name;
      moduleData.file_size = module.file_size;
    }

    let moduleId = module.id;

    if (moduleId) {
      // Update existing module
      const { error: moduleError } = await supabase
        .from('modules')
        .update(moduleData)
        .eq('id', moduleId);

      if (moduleError) {
        console.error('Error updating module:', moduleError);
        throw new Error(`Failed to update module: ${moduleError.message}`);
      }
    } else {
      // Create new module
      const { data: createdModule, error: moduleError } = await supabase
        .from('modules')
        .insert(moduleData)
        .select()
        .single();

      if (moduleError) {
        console.error('Error creating module:', moduleError);
        throw new Error(`Failed to create module: ${moduleError.message}`);
      }

      moduleId = createdModule.id;
    }

    // Handle lessons
    for (let lessonIndex = 0; lessonIndex < module.lessons.length; lessonIndex++) {
      const lesson = module.lessons[lessonIndex];
      
      let lessonData: any = {
        course_id: courseId,
        module_id: moduleId,
        title: lesson.title,
        description: lesson.description,
        sort_order: lessonIndex,
      };

      // Handle lesson image upload
      if (lesson.image_file) {
        try {
          lessonData.image_url = await uploadImageFile(lesson.image_file);
        } catch (error) {
          console.error('Error uploading lesson image:', error);
        }
      } else if (lesson.image_url) {
        lessonData.image_url = lesson.image_url;
      }

      // Handle lesson file upload
      if (lesson.file) {
        try {
          lessonData.file_url = await uploadVideoFile(lesson.file);
          lessonData.file_name = lesson.file.name;
          lessonData.file_size = lesson.file.size;
        } catch (error) {
          console.error('Error uploading lesson file:', error);
        }
      } else {
        lessonData.file_url = lesson.file_url;
        lessonData.file_name = lesson.file_name;
        lessonData.file_size = lesson.file_size;
      }

      let lessonId = lesson.id;

      if (lessonId) {
        // Update existing lesson
        const { error: lessonError } = await supabase
          .from('lessons')
          .update(lessonData)
          .eq('id', lessonId);

        if (lessonError) {
          console.error('Error updating lesson:', lessonError);
          throw new Error(`Failed to update lesson: ${lessonError.message}`);
        }
      } else {
        // Create new lesson
        const { data: createdLesson, error: lessonError } = await supabase
          .from('lessons')
          .insert(lessonData)
          .select()
          .single();

        if (lessonError) {
          console.error('Error creating lesson:', lessonError);
          throw new Error(`Failed to create lesson: ${lessonError.message}`);
        }

        lessonId = createdLesson.id;
      }

      // Handle units
      for (let unitIndex = 0; unitIndex < lesson.units.length; unitIndex++) {
        const unit = lesson.units[unitIndex];
        
        let unitData: any = {
          section_id: lessonId,
          title: unit.title,
          description: unit.description,
          content: unit.content,
          duration_minutes: unit.duration_minutes,
          sort_order: unitIndex,
        };

        // Handle unit video upload
        if (unit.video_file) {
          try {
            unitData.video_url = await uploadVideoFile(unit.video_file);
          } catch (error) {
            console.error('Error uploading unit video:', error);
          }
        } else if (unit.video_url) {
          unitData.video_url = unit.video_url;
        }

        // Handle unit file upload (legacy single file)
        if (unit.file) {
          try {
            unitData.file_url = await uploadVideoFile(unit.file);
            unitData.file_name = unit.file.name;
            unitData.file_size = unit.file.size;
          } catch (error) {
            console.error('Error uploading unit file:', error);
          }
        } else {
          unitData.file_url = unit.file_url;
          unitData.file_name = unit.file_name;
          unitData.file_size = unit.file_size;
        }

        // Handle multiple files upload
        let processedFiles = unit.files || [];
        if (unit.newFiles && unit.newFiles.length > 0) {
          try {
            const uploadedFiles = await createMultipleFileUpload(unit.newFiles, 'unit', unitIndex);
            processedFiles = [...processedFiles, ...uploadedFiles];
          } catch (error) {
            console.error('Error uploading multiple unit files:', error);
          }
        }

        if (processedFiles.length > 0) {
          unitData.files = JSON.stringify(processedFiles);
        }

        let unitId = unit.id;
        let shouldUpdateQuizAssignment = false;

        if (unitId) {
          // Update existing unit
          const { error: unitError } = await supabase
            .from('units')
            .update(unitData)
            .eq('id', unitId);

          if (unitError) {
            console.error('Error updating unit:', unitError);
            throw new Error(`Failed to update unit: ${unitError.message}`);
          }

          // Check if quiz assignment needs to be updated
          shouldUpdateQuizAssignment = true;
        } else {
          // Create new unit
          const { data: createdUnit, error: unitError } = await supabase
            .from('units')
            .insert(unitData)
            .select()
            .single();

          if (unitError) {
            console.error('Error creating unit:', unitError);
            throw new Error(`Failed to create unit: ${unitError.message}`);
          }

          unitId = createdUnit.id;
          shouldUpdateQuizAssignment = true;
        }

        // PRESERVE AND UPDATE QUIZ ASSIGNMENT
        if (shouldUpdateQuizAssignment && unit.quiz_id) {
          console.log(`Preserving/updating quiz assignment: Quiz ${unit.quiz_id} -> Unit ${unitId} (${unit.title})`);
          
          const { error: quizUpdateError } = await supabase
            .from('quizzes')
            .update({ unit_id: unitId })
            .eq('id', unit.quiz_id);

          if (quizUpdateError) {
            console.error(`Error updating quiz assignment for unit ${unit.title}:`, quizUpdateError);
          } else {
            console.log(`Successfully preserved quiz assignment: Quiz ${unit.quiz_id} -> Unit ${unitId}`);
          }
        }
      }
    }
  }

  console.log('Selective update completed with quiz assignment preservation');
};
