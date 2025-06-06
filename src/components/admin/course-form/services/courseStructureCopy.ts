
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface TemplateModule {
  title: string;
  description: string;
  sort_order: number;
  lessons: TemplateLesson[];
}

interface TemplateLesson {
  title: string;
  description: string;
  sort_order: number;
  units: TemplateUnit[];
}

interface TemplateUnit {
  title: string;
  description: string;
  content: string;
  sort_order: number;
}

export const extractCourseStructure = async (sourceCourseId: string): Promise<TemplateModule[]> => {
  console.log('Extracting structure from course:', sourceCourseId);
  
  const { data: modules, error } = await supabase
    .from('modules')
    .select(`
      title,
      description,
      sort_order,
      lessons (
        title,
        description,
        sort_order,
        units (
          title,
          description,
          content,
          sort_order
        )
      )
    `)
    .eq('course_id', sourceCourseId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error extracting course structure:', error);
    throw error;
  }

  return modules?.map(module => ({
    title: module.title,
    description: module.description || '',
    sort_order: module.sort_order,
    lessons: (module.lessons || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(lesson => ({
        title: lesson.title,
        description: lesson.description || '',
        sort_order: lesson.sort_order,
        units: (lesson.units || [])
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(unit => ({
            title: unit.title,
            description: unit.description || '',
            content: unit.content || '',
            sort_order: unit.sort_order
          }))
      }))
  })) || [];
};

export const replicateStructureToCourse = async (
  targetCourseId: string,
  templateStructure: TemplateModule[]
): Promise<void> => {
  console.log('Replicating structure to course:', targetCourseId);
  
  // Check if course already has content
  const { data: existingModules } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', targetCourseId)
    .limit(1);

  if (existingModules && existingModules.length > 0) {
    console.log('Course already has modules, skipping:', targetCourseId);
    return;
  }

  // Create modules, lessons, and units for the target course
  for (const moduleTemplate of templateStructure) {
    // Create module
    const { data: newModule, error: moduleError } = await supabase
      .from('modules')
      .insert({
        course_id: targetCourseId,
        title: moduleTemplate.title,
        description: moduleTemplate.description,
        sort_order: moduleTemplate.sort_order
      })
      .select()
      .single();

    if (moduleError) {
      console.error('Error creating module:', moduleError);
      throw moduleError;
    }

    console.log('Created module:', newModule.title);

    // Create lessons for this module
    for (const lessonTemplate of moduleTemplate.lessons) {
      const { data: newLesson, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          course_id: targetCourseId,
          module_id: newModule.id,
          title: lessonTemplate.title,
          description: lessonTemplate.description,
          sort_order: lessonTemplate.sort_order
        })
        .select()
        .single();

      if (lessonError) {
        console.error('Error creating lesson:', lessonError);
        throw lessonError;
      }

      console.log('Created lesson:', newLesson.title);

      // Create units for this lesson
      for (const unitTemplate of lessonTemplate.units) {
        const { error: unitError } = await supabase
          .from('units')
          .insert({
            section_id: newLesson.id,
            title: unitTemplate.title,
            description: unitTemplate.description,
            content: unitTemplate.content,
            sort_order: unitTemplate.sort_order,
            video_url: '',
            duration_minutes: 0
          });

        if (unitError) {
          console.error('Error creating unit:', unitError);
          throw unitError;
        }

        console.log('Created unit:', unitTemplate.title);
      }
    }
  }

  console.log('Successfully replicated structure to course:', targetCourseId);
};

export const copyStructureToAllCourses = async (): Promise<void> => {
  try {
    // Get all courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title')
      .order('title');

    if (coursesError) {
      throw coursesError;
    }

    // Find the source course (Legal Training-100)
    const sourceCourse = courses?.find(course => 
      course.title === 'Legal Training-100'
    );

    if (!sourceCourse) {
      throw new Error('Source course "Legal Training-100" not found');
    }

    // Get target courses (all except the source)
    const targetCourses = courses?.filter(course => 
      course.id !== sourceCourse.id
    ) || [];

    if (targetCourses.length === 0) {
      toast({
        title: "No Target Courses",
        description: "No other courses found to copy structure to.",
      });
      return;
    }

    // Extract structure from source course
    console.log('Extracting structure from Legal Training-100...');
    const templateStructure = await extractCourseStructure(sourceCourse.id);

    if (templateStructure.length === 0) {
      throw new Error('No structure found in source course');
    }

    console.log('Found structure:', templateStructure);

    // Replicate to each target course
    let successCount = 0;
    let skippedCount = 0;

    for (const targetCourse of targetCourses) {
      try {
        console.log(`Processing course: ${targetCourse.title}`);
        await replicateStructureToCourse(targetCourse.id, templateStructure);
        successCount++;
      } catch (error) {
        console.error(`Failed to copy structure to ${targetCourse.title}:`, error);
        if (error.message?.includes('already has modules')) {
          skippedCount++;
        } else {
          throw error;
        }
      }
    }

    toast({
      title: "Structure Copy Complete",
      description: `Successfully copied structure to ${successCount} courses. ${skippedCount} courses skipped (already had content).`,
    });

  } catch (error) {
    console.error('Error copying course structure:', error);
    toast({
      title: "Error",
      description: `Failed to copy course structure: ${error.message}`,
      variant: "destructive",
    });
    throw error;
  }
};
