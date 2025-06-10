import { supabase } from "@/integrations/supabase/client";
import { CourseFormData, ModuleData } from "../types";
import { uploadImageFile } from "../fileUploadUtils";
import { preserveQuizAssignmentsEnhanced, restoreQuizAssignmentsEnhanced, QuizAssignmentData } from "./enhancedQuizPreservation";

export interface SafeUpdateResult {
  success: boolean;
  courseId?: string;
  errors: string[];
  warnings: string[];
  itemsUpdated: number;
  itemsCreated: number;
  itemsPreserved: number;
  quizAssignmentsPreserved: number;
  quizAssignmentsRestored: number;
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
    itemsPreserved: 0,
    quizAssignmentsPreserved: 0,
    quizAssignmentsRestored: 0
  };

  let preservedQuizAssignments: QuizAssignmentData[] = [];

  try {
    console.log('🛡️ Starting SAFE course update for:', courseId);

    // Phase 0: Preserve quiz assignments BEFORE any modifications
    const phase0Start = Date.now();
    console.log('🎯 Phase 0: Preserving quiz assignments before update');
    
    const preservationResult = await preserveQuizAssignmentsEnhanced(courseId);
    if (preservationResult.success) {
      preservedQuizAssignments = preservationResult.preservedAssignments;
      result.quizAssignmentsPreserved = preservedQuizAssignments.length;
      console.log(`✅ Preserved ${preservedQuizAssignments.length} quiz assignments`);
      
      if (preservationResult.warnings.length > 0) {
        result.warnings.push(...preservationResult.warnings);
      }
    } else {
      console.error('❌ Quiz preservation failed:', preservationResult.errors);
      result.warnings.push(...preservationResult.errors.map(err => `Quiz preservation warning: ${err}`));
    }
    
    phaseTimings.phase0_quiz_preservation = Date.now() - phase0Start;

    // Phase 1: Update course metadata only
    const phase1Start = Date.now();
    console.log('📝 Phase 1: Updating course metadata safely');
    
    await updateCourseMetadataSafely(courseId, courseData);
    phaseTimings.phase1_metadata = Date.now() - phase1Start;

    // Phase 2: Enhanced incremental content updates with quiz preservation
    const phase2Start = Date.now();
    console.log('🔧 Phase 2: Performing enhanced incremental content updates with quiz preservation');
    
    const updateStats = await performEnhancedIncrementalUpdate(courseId, modules, preservedQuizAssignments);
    result.itemsUpdated = updateStats.updated;
    result.itemsCreated = updateStats.created;
    result.itemsPreserved = updateStats.preserved;
    
    phaseTimings.phase2_content = Date.now() - phase2Start;

    // Phase 3: Final quiz assignment verification
    const phase3Start = Date.now();
    console.log('🔄 Phase 3: Verifying quiz assignments after content update');
    
    const verificationResult = await verifyQuizAssignments(courseId, modules);
    result.quizAssignmentsRestored = verificationResult.restored;
    
    if (verificationResult.warnings.length > 0) {
      result.warnings.push(...verificationResult.warnings);
    }
    
    phaseTimings.phase3_quiz_verification = Date.now() - phase3Start;

    // Phase 4: Validation (non-destructive)
    const phase4Start = Date.now();
    console.log('✅ Phase 4: Validating course integrity and quiz assignments');
    
    const validation = await validateCourseIntegrityWithQuizzes(courseId, preservedQuizAssignments);
    if (validation.issues.length > 0) {
      result.warnings.push(...validation.issues);
    }
    
    phaseTimings.phase4_validation = Date.now() - phase4Start;

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
      itemsPreserved: result.itemsPreserved,
      quizAssignmentsPreserved: result.quizAssignmentsPreserved,
      quizAssignmentsRestored: result.quizAssignmentsRestored
    });

    return result;

  } catch (error) {
    console.error('💥 Safe course update failed:', error);
    result.errors.push(`Update failed: ${error.message}`);
    
    // If we have preserved quiz assignments and the update failed, try to restore them
    if (preservedQuizAssignments.length > 0) {
      console.log('🚨 Attempting emergency quiz assignment restoration due to update failure');
      try {
        await restoreQuizAssignmentsEnhanced(courseId, preservedQuizAssignments, modules);
        result.warnings.push('Emergency quiz assignment restoration attempted due to update failure');
      } catch (restoreError) {
        console.error('💥 Emergency restoration also failed:', restoreError);
        result.errors.push(`Emergency quiz restoration failed: ${restoreError.message}`);
      }
    }
    
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

  // Validate level exists in the levels table before updating
  if (courseData.level) {
    const { data: levelExists, error: levelError } = await supabase
      .from('levels')
      .select('code')
      .eq('code', courseData.level)
      .maybeSingle();

    if (levelError) {
      console.error('Error checking level:', levelError);
      throw new Error(`Failed to validate level: ${levelError.message}`);
    }

    if (!levelExists) {
      console.error('Level not found:', courseData.level);
      throw new Error(`Level "${courseData.level}" does not exist in the database. Please select a valid level.`);
    }
  }

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

const performEnhancedIncrementalUpdate = async (
  courseId: string, 
  modules: ModuleData[], 
  preservedQuizAssignments: QuizAssignmentData[]
) => {
  console.log('🔄 Starting enhanced incremental content update with quiz preservation');
  
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

    // Create a map of preserved quiz assignments by unit title for easy lookup
    const quizByUnitTitle = new Map();
    preservedQuizAssignments.forEach(qa => {
      const key = `${qa.moduleTitle}:${qa.lessonTitle}:${qa.unitTitle}`;
      quizByUnitTitle.set(key, qa.quizId);
    });

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
        await updateExistingModuleEnhanced(existingModule.id, moduleData, i, quizByUnitTitle);
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

    console.log('✅ Enhanced incremental content update completed safely', {
      updated,
      created,
      preserved
    });

    return { updated, created, preserved };

  } catch (error) {
    console.error('❌ Error during enhanced incremental content update:', error);
    throw new Error(`Enhanced incremental update failed: ${error.message}`);
  }
};

const updateExistingModuleEnhanced = async (
  moduleId: string, 
  moduleData: ModuleData, 
  sortOrder: number, 
  quizByUnitTitle: Map<string, string>
) => {
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

  // Update lessons incrementally with enhanced unit handling
  if (moduleData.lessons) {
    await updateLessonsEnhanced(moduleId, moduleData.lessons, moduleData.title, quizByUnitTitle);
  }
};

const updateLessonsEnhanced = async (
  moduleId: string, 
  lessons: any[], 
  moduleTitle: string, 
  quizByUnitTitle: Map<string, string>
) => {
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
      // Update existing lesson with enhanced unit handling
      await updateExistingLessonEnhanced(existingLesson.id, lessonData, i, moduleTitle, quizByUnitTitle);
    } else {
      // Create new lesson
      await createNewLesson(moduleId, lessonData, i);
    }
  }
};

const updateExistingLessonEnhanced = async (
  lessonId: string, 
  lessonData: any, 
  sortOrder: number, 
  moduleTitle: string, 
  quizByUnitTitle: Map<string, string>
) => {
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

  // Update units with enhanced handling that preserves order and quiz assignments
  if (lessonData.units) {
    await updateUnitsEnhanced(lessonId, lessonData.units, moduleTitle, lessonData.title, quizByUnitTitle);
  }
};

const updateUnitsEnhanced = async (
  lessonId: string, 
  units: any[], 
  moduleTitle: string, 
  lessonTitle: string, 
  quizByUnitTitle: Map<string, string>
) => {
  // Get existing units for this lesson
  const { data: existingUnits } = await supabase
    .from('units')
    .select('*')
    .eq('section_id', lessonId)
    .order('sort_order', { ascending: true });

  for (let i = 0; i < units.length; i++) {
    const unitData = units[i];
    
    // Determine the quiz assignment for this unit
    const quizKey = `${moduleTitle}:${lessonTitle}:${unitData.title}`;
    const preservedQuizId = quizByUnitTitle.get(quizKey);
    const finalQuizId = unitData.quiz_id || preservedQuizId;
    
    console.log(`Unit "${unitData.title}" - Form quiz: ${unitData.quiz_id}, Preserved quiz: ${preservedQuizId}, Final: ${finalQuizId}`);
    
    // Find existing unit by ID or title+position
    const existingUnit = existingUnits?.find(eu => 
      (unitData.id && eu.id === unitData.id) ||
      (eu.title === unitData.title && eu.sort_order === i)
    );

    if (existingUnit) {
      // Update existing unit with preserved quiz assignment and correct sort order
      console.log(`Updating existing unit: ${unitData.title} at position ${i}`);
      await updateExistingUnitEnhanced(existingUnit.id, unitData, i, finalQuizId);
    } else {
      // Create new unit
      console.log(`Creating new unit: ${unitData.title} at position ${i}`);
      await createNewUnitEnhanced(lessonId, unitData, i, finalQuizId);
    }
  }
};

const updateExistingUnitEnhanced = async (
  unitId: string, 
  unitData: any, 
  sortOrder: number, 
  quizId?: string
) => {
  const { error: unitError } = await supabase
    .from('units')
    .update({
      title: unitData.title,
      description: unitData.description,
      content: unitData.content,
      video_url: unitData.video_url,
      duration_minutes: unitData.duration_minutes,
      sort_order: sortOrder,  // Explicitly set the correct sort order
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

  // Handle quiz assignment separately
  if (quizId) {
    console.log(`Assigning quiz ${quizId} to unit ${unitId}`);
    const { error: quizError } = await supabase
      .from('quizzes')
      .update({ unit_id: unitId })
      .eq('id', quizId);

    if (quizError) {
      console.error(`Failed to assign quiz to unit: ${quizError.message}`);
    } else {
      console.log(`✅ Quiz successfully assigned to unit`);
    }
  }
};

const createNewUnitEnhanced = async (
  lessonId: string, 
  unitData: any, 
  sortOrder: number, 
  quizId?: string
) => {
  const { data: unit, error } = await supabase
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
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create unit: ${error.message}`);
  }

  // Handle quiz assignment
  if (quizId && unit) {
    console.log(`Assigning quiz ${quizId} to new unit ${unit.id}`);
    const { error: quizError } = await supabase
      .from('quizzes')
      .update({ unit_id: unit.id })
      .eq('id', quizId);

    if (quizError) {
      console.error(`Failed to assign quiz to new unit: ${quizError.message}`);
    } else {
      console.log(`✅ Quiz successfully assigned to new unit`);
    }
  }
};

const verifyQuizAssignments = async (courseId: string, modules: ModuleData[]) => {
  console.log('🔍 Verifying quiz assignments after update...');
  
  let restored = 0;
  const warnings: string[] = [];

  try {
    // Get all quiz assignments that should exist based on the form data
    const expectedAssignments: { unitTitle: string; quizId: string }[] = [];
    
    modules.forEach(module => {
      module.lessons?.forEach(lesson => {
        lesson.units?.forEach(unit => {
          if (unit.quiz_id) {
            expectedAssignments.push({
              unitTitle: unit.title,
              quizId: unit.quiz_id
            });
          }
        });
      });
    });

    console.log(`Expected ${expectedAssignments.length} quiz assignments from form`);

    // Verify each expected assignment
    for (const expected of expectedAssignments) {
      const { data: quiz, error } = await supabase
        .from('quizzes')
        .select('id, unit_id')
        .eq('id', expected.quizId)
        .single();

      if (error) {
        warnings.push(`Could not verify quiz ${expected.quizId} for unit ${expected.unitTitle}`);
        continue;
      }

      if (quiz.unit_id) {
        restored++;
        console.log(`✅ Verified quiz assignment: ${expected.quizId} -> unit ${quiz.unit_id}`);
      } else {
        warnings.push(`Quiz ${expected.quizId} is not assigned to any unit (expected: ${expected.unitTitle})`);
      }
    }

    return { restored, warnings };

  } catch (error) {
    console.error('Error verifying quiz assignments:', error);
    return { restored: 0, warnings: [`Verification failed: ${error.message}`] };
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

const validateCourseIntegrityWithQuizzes = async (courseId: string, expectedQuizAssignments: QuizAssignmentData[]) => {
  console.log('🔍 Validating course integrity and quiz assignments...');
  
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
  
  // Basic integrity check
  const moduleCount = modules?.length || 0;
  const lessonCount = modules?.flatMap(m => m.lessons || []).length || 0;
  const unitCount = modules?.flatMap(m => 
    m.lessons?.flatMap(l => l.units || []) || []
  ).length || 0;

  if (moduleCount === 0) {
    issues.push('Course has no modules');
  }

  // Validate quiz assignments
  if (expectedQuizAssignments.length > 0) {
    console.log(`🎯 Validating ${expectedQuizAssignments.length} expected quiz assignments...`);
    
    // Get all units in the course after update
    const allUnits = modules?.flatMap(m => 
      m.lessons?.flatMap(l => l.units || []) || []
    ) || [];
    
    const unitIds = allUnits.map(u => u.id);
    
    // Check current quiz assignments
    const { data: currentQuizzes } = await supabase
      .from('quizzes')
      .select('id, unit_id, title')
      .in('unit_id', unitIds)
      .eq('is_deleted', false);
    
    const currentAssignmentCount = currentQuizzes?.length || 0;
    const expectedCount = expectedQuizAssignments.length;
    
    if (currentAssignmentCount < expectedCount) {
      issues.push(`Missing quiz assignments: expected ${expectedCount}, found ${currentAssignmentCount}`);
    }
    
    console.log(`🎯 Quiz validation: ${currentAssignmentCount}/${expectedCount} assignments found`);
  }

  console.log('🔍 Integrity validation completed:', {
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
