
import { supabase } from "@/integrations/supabase/client";
import { CourseFormData, ModuleData } from "../types";
import { uploadImageFile } from "../fileUploadUtils";
import { createMultipleFileUpload } from "./fileUploadService";

export const createCourseWithContent = async (
  courseData: CourseFormData, 
  modules: ModuleData[], 
  isDraft: boolean = false
) => {
  console.log('🆕 Creating course with content...', { courseData, modulesCount: modules.length });

  try {
    // Upload course image if provided
    let imageUrl = courseData.image_url || '';
    if (courseData.image_file) {
      console.log('Uploading course image...');
      imageUrl = await uploadImageFile(courseData.image_file);
    }

    // Create the course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        title: courseData.title,
        description: courseData.description,
        instructor: courseData.instructor,
        category: courseData.category,
        level: courseData.level,
        duration: courseData.duration,
        image_url: imageUrl,
        is_draft: isDraft
      })
      .select()
      .single();

    if (courseError) {
      console.error('Error creating course:', courseError);
      throw courseError;
    }

    console.log('✅ Course created:', course.id);

    // Create modules, lessons, and units if provided
    if (modules && modules.length > 0) {
      await createModulesWithContent(course.id, modules);
    }

    return course;
  } catch (error) {
    console.error('Error in createCourseWithContent:', error);
    throw error;
  }
};

const createModulesWithContent = async (courseId: string, modules: ModuleData[]) => {
  console.log('Creating modules with content for course:', courseId);

  for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
    const module = modules[moduleIndex];
    
    try {
      // Upload module image if provided
      let moduleImageUrl = module.image_url || '';
      if (module.image_file) {
        moduleImageUrl = await uploadImageFile(module.image_file);
      }

      // Create module
      const { data: createdModule, error: moduleError } = await supabase
        .from('modules')
        .insert({
          course_id: courseId,
          title: module.title,
          description: module.description,
          image_url: moduleImageUrl,
          sort_order: module.sort_order || moduleIndex
        })
        .select()
        .single();

      if (moduleError) {
        console.error('Error creating module:', moduleError);
        throw moduleError;
      }

      console.log('✅ Module created:', createdModule.id, createdModule.title);

      // Create lessons for this module
      if (module.lessons && module.lessons.length > 0) {
        await createLessonsWithContent(courseId, createdModule.id, module.lessons);
      }
    } catch (error) {
      console.error('Error creating module:', module.title, error);
      throw error;
    }
  }
};

const createLessonsWithContent = async (courseId: string, moduleId: string, lessons: any[]) => {
  console.log('Creating lessons for module:', moduleId);

  for (let lessonIndex = 0; lessonIndex < lessons.length; lessonIndex++) {
    const lesson = lessons[lessonIndex];
    
    try {
      // Upload lesson image if provided
      let lessonImageUrl = lesson.image_url || '';
      if (lesson.image_file) {
        lessonImageUrl = await uploadImageFile(lesson.image_file);
      }

      // Create lesson
      const { data: createdLesson, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          course_id: courseId,
          module_id: moduleId,
          title: lesson.title,
          description: lesson.description,
          image_url: lessonImageUrl,
          sort_order: lesson.sort_order || lessonIndex
        })
        .select()
        .single();

      if (lessonError) {
        console.error('Error creating lesson:', lessonError);
        throw lessonError;
      }

      console.log('✅ Lesson created:', createdLesson.id, createdLesson.title);

      // Create units for this lesson
      if (lesson.units && lesson.units.length > 0) {
        await createUnitsWithContent(createdLesson.id, lesson.units);
      }
    } catch (error) {
      console.error('Error creating lesson:', lesson.title, error);
      throw error;
    }
  }
};

const createUnitsWithContent = async (lessonId: string, units: any[]) => {
  console.log('Creating units for lesson:', lessonId);

  for (let unitIndex = 0; unitIndex < units.length; unitIndex++) {
    const unit = units[unitIndex];
    
    try {
      // Handle file uploads for units
      let filesData = null;
      if (unit.files && unit.files.length > 0) {
        const uploadedFiles = await createMultipleFileUpload(
          unit.files,
          'unit',
          unitIndex
        );
        filesData = uploadedFiles;
      }

      // Create unit
      const { data: createdUnit, error: unitError } = await supabase
        .from('units')
        .insert({
          section_id: lessonId,
          title: unit.title,
          description: unit.description,
          content: unit.content || '',
          video_url: unit.video_url || '',
          duration_minutes: unit.duration_minutes || 0,
          sort_order: unit.sort_order || unitIndex,
          files: filesData
        })
        .select()
        .single();

      if (unitError) {
        console.error('Error creating unit:', unitError);
        throw unitError;
      }

      console.log('✅ Unit created:', createdUnit.id, createdUnit.title);

      // Handle quiz assignment if provided
      if (unit.quiz_id && unit.quiz_id.trim() !== '') {
        await assignQuizToUnit(createdUnit.id, unit.quiz_id);
      }
    } catch (error) {
      console.error('Error creating unit:', unit.title, error);
      throw error;
    }
  }
};

const assignQuizToUnit = async (unitId: string, quizId: string) => {
  try {
    const { error } = await supabase
      .from('quizzes')
      .update({ unit_id: unitId })
      .eq('id', quizId);

    if (error) {
      console.error('Error assigning quiz to unit:', error);
      throw error;
    }

    console.log('✅ Quiz assigned to unit:', quizId, '→', unitId);
  } catch (error) {
    console.error('Error in assignQuizToUnit:', error);
    throw error;
  }
};
