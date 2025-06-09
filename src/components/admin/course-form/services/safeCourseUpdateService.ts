
import { supabase } from "@/integrations/supabase/client";
import { CourseFormData, ModuleData } from "../types";
import { uploadImageFile } from "../fileUploadUtils";

export interface SafeUpdateResult {
  success: boolean;
  courseId?: string;
  errors: string[];
  warnings: string[];
  itemsUpdated: number;
  itemsCreated: number;
  itemsPreserved: number;
  performanceMetrics?: {
    totalDurationMs: number;
    phaseTimings: Record<string, number>;
  };
}

export const performSafeCourseUpdate = async (
  courseId: string,
  courseData: CourseFormData,
  modules: ModuleData[]
): Promise<SafeUpdateResult> => {
  const startTime = Date.now();
  const phaseTimings: Record<string, number> = {};
  
  const result: SafeUpdateResult = {
    success: false,
    errors: [],
    warnings: [],
    itemsUpdated: 0,
    itemsCreated: 0,
    itemsPreserved: 0
  };

  try {
    console.log('🛡️ Starting SAFE course update for:', courseId);

    // Phase 1: Update course metadata only
    const phase1Start = Date.now();
    console.log('📝 Phase 1: Updating course metadata safely');
    
    await updateCourseMetadataSafely(courseId, courseData);
    phaseTimings.phase1_metadata = Date.now() - phase1Start;

    // Phase 2: Incremental content updates (NO DELETIONS)
    const phase2Start = Date.now();
    console.log('🔧 Phase 2: Performing incremental content updates (preserving all data)');
    
    const updateStats = await performIncrementalContentUpdate(courseId, modules);
    result.itemsUpdated = updateStats.updated;
    result.itemsCreated = updateStats.created;
    result.itemsPreserved = updateStats.preserved;
    
    phaseTimings.phase2_content = Date.now() - phase2Start;

    // Phase 3: Validation only (no destructive operations)
    const phase3Start = Date.now();
    console.log('✅ Phase 3: Validating course integrity (non-destructive)');
    
    const validation = await validateCourseIntegrityNonDestructive(courseId);
    if (validation.issues.length > 0) {
      result.warnings.push(...validation.issues);
    }
    
    phaseTimings.phase3_validation = Date.now() - phase3Start;

    result.success = true;
    result.courseId = courseId;
    
    const totalTime = Date.now() - startTime;
    result.performanceMetrics = {
      totalDurationMs: totalTime,
      phaseTimings
    };

    console.log('✨ SAFE course update completed successfully!', {
      totalTime: `${totalTime}ms`,
      itemsUpdated: result.itemsUpdated,
      itemsCreated: result.itemsCreated,
      itemsPreserved: result.itemsPreserved
    });

    return result;

  } catch (error) {
    console.error('💥 Safe course update failed:', error);
    result.errors.push(`Update failed: ${error.message}`);
    return result;
  }
};

const updateCourseMetadataSafely = async (courseId: string, courseData: CourseFormData) => {
  console.log('Updating course metadata safely...');
  
  const updateData: any = {
    title: courseData.title,
    description: courseData.description,
    instructor: courseData.instructor,
    category: courseData.category,
    level: courseData.level,
    duration: courseData.duration,
    updated_at: new Date().toISOString(),
  };

  if (courseData.image_file) {
    try {
      updateData.image_url = await uploadImageFile(courseData.image_file);
    } catch (error) {
      console.warn('Image upload failed:', error);
    }
  }

  const { error } = await supabase
    .from('courses')
    .update(updateData)
    .eq('id', courseId);

  if (error) {
    throw new Error(`Failed to update course metadata: ${error.message}`);
  }
  
  console.log('Course metadata updated safely');
};

const performIncrementalContentUpdate = async (courseId: string, modules: ModuleData[]) => {
  console.log('🔄 Starting incremental content update (NO data loss)');
  
  let updated = 0;
  let created = 0;
  let preserved = 0;

  try {
    // Get existing modules to compare against
    const { data: existingModules, error: fetchError } = await supabase
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

    if (fetchError) {
      throw new Error(`Failed to fetch existing modules: ${fetchError.message}`);
    }

    console.log('Existing modules found:', existingModules?.length || 0);

    // Process each module incrementally
    for (let i = 0; i < modules.length; i++) {
      const moduleData = modules[i];
      
      // Check if module exists (by ID or by title+position)
      const existingModule = existingModules?.find(em => 
        (moduleData.id && em.id === moduleData.id) ||
        (em.title === moduleData.title && em.sort_order === i)
      );

      if (existingModule) {
        // Update existing module
        console.log(`Updating existing module: ${moduleData.title}`);
        await updateExistingModule(existingModule.id, moduleData, i);
        updated++;
      } else {
        // Create new module
        console.log(`Creating new module: ${moduleData.title}`);
        await createNewModule(courseId, moduleData, i);
        created++;
      }
    }

    // Count preserved items (existing modules not in the form)
    const formModuleIds = modules.filter(m => m.id).map(m => m.id);
    const preservedModules = existingModules?.filter(em => 
      !formModuleIds.includes(em.id) && 
      !modules.some(m => m.title === em.title)
    ) || [];
    
    preserved = preservedModules.length;
    
    if (preserved > 0) {
      console.log(`Preserved ${preserved} existing modules not in form`);
    }

    console.log('✅ Incremental content update completed safely', {
      updated,
      created,
      preserved
    });

    return { updated, created, preserved };

  } catch (error) {
    console.error('❌ Error during incremental content update:', error);
    throw new Error(`Incremental update failed: ${error.message}`);
  }
};

const updateExistingModule = async (moduleId: string, moduleData: ModuleData, sortOrder: number) => {
  // Update module metadata
  const { error: moduleError } = await supabase
    .from('modules')
    .update({
      title: moduleData.title,
      description: moduleData.description,
      image_url: moduleData.image_url,
      sort_order: sortOrder,
      updated_at: new Date().toISOString()
    })
    .eq('id', moduleId);

  if (moduleError) {
    throw new Error(`Failed to update module: ${moduleError.message}`);
  }

  // Update lessons incrementally
  if (moduleData.lessons) {
    await updateLessonsIncrementally(moduleId, moduleData.lessons);
  }
};

const updateLessonsIncrementally = async (moduleId: string, lessons: any[]) => {
  // Get existing lessons for this module
  const { data: existingLessons } = await supabase
    .from('lessons')
    .select(`
      *,
      units:units(*)
    `)
    .eq('module_id', moduleId)
    .order('sort_order', { ascending: true });

  for (let i = 0; i < lessons.length; i++) {
    const lessonData = lessons[i];
    
    // Find existing lesson by ID or title+position
    const existingLesson = existingLessons?.find(el => 
      (lessonData.id && el.id === lessonData.id) ||
      (el.title === lessonData.title && el.sort_order === i)
    );

    if (existingLesson) {
      // Update existing lesson
      await updateExistingLesson(existingLesson.id, lessonData, i);
    } else {
      // Create new lesson
      await createNewLesson(moduleId, lessonData, i);
    }
  }
};

const updateExistingLesson = async (lessonId: string, lessonData: any, sortOrder: number) => {
  const { error: lessonError } = await supabase
    .from('lessons')
    .update({
      title: lessonData.title,
      description: lessonData.description,
      image_url: lessonData.image_url,
      sort_order: sortOrder,
      updated_at: new Date().toISOString()
    })
    .eq('id', lessonId);

  if (lessonError) {
    throw new Error(`Failed to update lesson: ${lessonError.message}`);
  }

  // Update units incrementally
  if (lessonData.units) {
    await updateUnitsIncrementally(lessonId, lessonData.units);
  }
};

const updateUnitsIncrementally = async (lessonId: string, units: any[]) => {
  // Get existing units for this lesson
  const { data: existingUnits } = await supabase
    .from('units')
    .select('*')
    .eq('section_id', lessonId)
    .order('sort_order', { ascending: true });

  for (let i = 0; i < units.length; i++) {
    const unitData = units[i];
    
    // Find existing unit by ID or title+position
    const existingUnit = existingUnits?.find(eu => 
      (unitData.id && eu.id === unitData.id) ||
      (eu.title === unitData.title && eu.sort_order === i)
    );

    if (existingUnit) {
      // Update existing unit
      console.log(`Updating existing unit: ${unitData.title}`);
      await updateExistingUnit(existingUnit.id, unitData, i);
    } else {
      // Create new unit
      console.log(`Creating new unit: ${unitData.title}`);
      await createNewUnit(lessonId, unitData, i);
    }
  }
};

const updateExistingUnit = async (unitId: string, unitData: any, sortOrder: number) => {
  const { error: unitError } = await supabase
    .from('units')
    .update({
      title: unitData.title,
      description: unitData.description,
      content: unitData.content,
      video_url: unitData.video_url,
      duration_minutes: unitData.duration_minutes,
      sort_order: sortOrder,
      files: unitData.files,
      file_url: unitData.file_url,
      file_name: unitData.file_name,
      file_size: unitData.file_size,
      updated_at: new Date().toISOString()
    })
    .eq('id', unitId);

  if (unitError) {
    throw new Error(`Failed to update unit: ${unitError.message}`);
  }
};

const createNewModule = async (courseId: string, moduleData: ModuleData, sortOrder: number) => {
  const { createCourseWithModules } = await import("./courseSubmissionService");
  
  // Create just this module using existing service
  const tempModules = [{
    ...moduleData,
    sort_order: sortOrder
  }];
  
  const dummyCourseData = {
    title: '',
    description: '',
    instructor: '',
    category: '',
    level: '',
    duration: ''
  };
  
  await createCourseWithModules(courseId, dummyCourseData, tempModules);
};

const createNewLesson = async (moduleId: string, lessonData: any, sortOrder: number) => {
  const { data: courseData } = await supabase
    .from('modules')
    .select('course_id')
    .eq('id', moduleId)
    .single();

  if (!courseData) return;

  const { data: lesson, error } = await supabase
    .from('lessons')
    .insert({
      course_id: courseData.course_id,
      module_id: moduleId,
      title: lessonData.title,
      description: lessonData.description,
      image_url: lessonData.image_url,
      sort_order: sortOrder
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create lesson: ${error.message}`);
  }

  // Create units for this lesson
  if (lessonData.units && lesson) {
    for (let i = 0; i < lessonData.units.length; i++) {
      await createNewUnit(lesson.id, lessonData.units[i], i);
    }
  }
};

const createNewUnit = async (lessonId: string, unitData: any, sortOrder: number) => {
  const { error } = await supabase
    .from('units')
    .insert({
      section_id: lessonId,
      title: unitData.title,
      description: unitData.description,
      content: unitData.content,
      video_url: unitData.video_url,
      duration_minutes: unitData.duration_minutes,
      sort_order: sortOrder,
      files: unitData.files,
      file_url: unitData.file_url,
      file_name: unitData.file_name,
      file_size: unitData.file_size
    });

  if (error) {
    throw new Error(`Failed to create unit: ${error.message}`);
  }
};

const validateCourseIntegrityNonDestructive = async (courseId: string) => {
  console.log('🔍 Validating course integrity (non-destructive)...');
  
  const { data: modules } = await supabase
    .from('modules')
    .select(`
      *,
      lessons:lessons(
        *,
        units:units(*)
      )
    `)
    .eq('course_id', courseId);

  const issues: string[] = [];
  
  // Just report issues, don't fix them destructively
  const moduleCount = modules?.length || 0;
  const lessonCount = modules?.flatMap(m => m.lessons || []).length || 0;
  const unitCount = modules?.flatMap(m => 
    m.lessons?.flatMap(l => l.units || []) || []
  ).length || 0;

  if (moduleCount === 0) {
    issues.push('Course has no modules');
  }

  console.log('🔍 Integrity validation completed (non-destructive):', {
    modules: moduleCount,
    lessons: lessonCount,
    units: unitCount,
    issues: issues.length
  });

  return {
    score: issues.length === 0 ? 100 : 80,
    issues,
    summary: {
      modules: moduleCount,
      lessons: lessonCount,
      units: unitCount
    }
  };
};
