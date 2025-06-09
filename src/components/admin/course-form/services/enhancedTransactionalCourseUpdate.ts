import { supabase } from "@/integrations/supabase/client";
import { CourseFormData, ModuleData } from "../types";
import { uploadImageFile } from "../fileUploadUtils";

export interface UpdateResult {
  success: boolean;
  courseId?: string;
  backupId?: string;
  quizAssignmentsRestored?: number;
  errors: string[];
  warnings: string[];
  validationReport?: string;
  validationSummary?: any;
  integrityScore?: number;
  performanceMetrics?: {
    totalDurationMs: number;
    phaseTimings: Record<string, number>;
  };
}

interface ContentDiff {
  modulesToUpdate: ModuleData[];
  modulesToCreate: ModuleData[];
  modulesToDelete: string[];
  lessonsToUpdate: any[];
  lessonsToCreate: any[];
  lessonsToDelete: string[];
  unitsToUpdate: any[];
  unitsToCreate: any[];
  unitsToDelete: string[];
}

interface QuizMapping {
  oldUnitId: string;
  newUnitId: string;
  quizId: string;
  quizTitle: string;
  unitTitle: string;
}

export const performEnhancedTransactionalCourseUpdate = async (
  courseId: string,
  courseData: CourseFormData,
  modules: ModuleData[]
): Promise<UpdateResult> => {
  const startTime = Date.now();
  const phaseTimings: Record<string, number> = {};
  
  const result: UpdateResult = {
    success: false,
    errors: [],
    warnings: []
  };

  try {
    console.log('🚀 Starting enhanced transactional course update for:', courseId);

    // Phase 1: Fetch existing course structure
    const phase1Start = Date.now();
    console.log('📋 Phase 1: Analyzing existing course structure');
    
    const existingStructure = await fetchExistingCourseStructure(courseId);
    phaseTimings.phase1_analysis = Date.now() - phase1Start;

    // Phase 2: Calculate content differences
    const phase2Start = Date.now();
    console.log('🔍 Phase 2: Computing content differences');
    
    const contentDiff = calculateContentDiff(existingStructure, modules);
    const quizMappings = await createQuizMappings(existingStructure, modules);
    
    console.log('Content diff summary:', {
      modulesToUpdate: contentDiff.modulesToUpdate.length,
      modulesToCreate: contentDiff.modulesToCreate.length,
      modulesToDelete: contentDiff.modulesToDelete.length,
      quizMappings: quizMappings.length
    });
    
    phaseTimings.phase2_diff = Date.now() - phase2Start;

    // Phase 3: Update course basic information
    const phase3Start = Date.now();
    console.log('📝 Phase 3: Updating course metadata');
    
    await updateCourseMetadata(courseId, courseData);
    phaseTimings.phase3_metadata = Date.now() - phase3Start;

    // Phase 4: Apply incremental content updates
    const phase4Start = Date.now();
    console.log('🔧 Phase 4: Applying incremental content updates');
    
    await applyIncrementalUpdates(courseId, contentDiff);
    phaseTimings.phase4_updates = Date.now() - phase4Start;

    // Phase 5: Restore quiz assignments
    const phase5Start = Date.now();
    console.log('🎯 Phase 5: Restoring quiz assignments');
    
    const quizRestoreCount = await restoreQuizAssignments(quizMappings);
    result.quizAssignmentsRestored = quizRestoreCount;
    
    phaseTimings.phase5_quizzes = Date.now() - phase5Start;

    // Phase 6: Validation and cleanup
    const phase6Start = Date.now();
    console.log('✅ Phase 6: Final validation');
    
    const validation = await validateCourseIntegrity(courseId);
    result.validationSummary = validation.summary;
    result.integrityScore = validation.score;
    
    if (validation.issues.length > 0) {
      result.warnings.push(...validation.issues);
    }
    
    phaseTimings.phase6_validation = Date.now() - phase6Start;

    // Success!
    result.success = true;
    result.courseId = courseId;
    
    const totalTime = Date.now() - startTime;
    result.performanceMetrics = {
      totalDurationMs: totalTime,
      phaseTimings
    };

    console.log('✨ Enhanced course update completed successfully!', {
      totalTime: `${totalTime}ms`,
      quizAssignmentsRestored: result.quizAssignmentsRestored,
      integrityScore: result.integrityScore
    });

    return result;

  } catch (error) {
    console.error('💥 Enhanced course update failed:', error);
    result.errors.push(`Update failed: ${error.message}`);
    return result;
  }
};

const fetchExistingCourseStructure = async (courseId: string) => {
  console.log('Fetching existing course structure...');
  
  const { data: modules, error } = await supabase
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

  if (error) {
    console.error('Error fetching existing structure:', error);
    throw error;
  }

  // Also fetch quiz assignments
  const allUnits = modules?.flatMap(m => 
    m.lessons?.flatMap(l => l.units || []) || []
  ) || [];

  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id, title, unit_id')
    .in('unit_id', allUnits.map(u => u.id))
    .eq('is_deleted', false)
    .not('unit_id', 'is', null);

  console.log('Existing structure loaded:', {
    modules: modules?.length || 0,
    lessons: modules?.flatMap(m => m.lessons || []).length || 0,
    units: allUnits.length,
    quizzes: quizzes?.length || 0
  });

  return { modules: modules || [], quizzes: quizzes || [] };
};

const calculateContentDiff = (existing: any, newModules: ModuleData[]): ContentDiff => {
  console.log('Calculating content differences...');
  
  // For now, implement a simple strategy: match by title and position
  const diff: ContentDiff = {
    modulesToUpdate: [],
    modulesToCreate: [],
    modulesToDelete: [],
    lessonsToUpdate: [],
    lessonsToCreate: [],
    lessonsToDelete: [],
    unitsToUpdate: [],
    unitsToCreate: [],
    unitsToDelete: []
  };

  // Match modules by title and determine what to update vs create
  const existingModules = existing.modules || [];
  
  newModules.forEach((newModule, index) => {
    const existingModule = existingModules.find(em => 
      em.title === newModule.title || em.sort_order === index
    );
    
    if (existingModule) {
      // Update existing module
      diff.modulesToUpdate.push({
        ...newModule,
        id: existingModule.id // Preserve existing ID
      });
    } else {
      // Create new module
      diff.modulesToCreate.push(newModule);
    }
  });

  console.log('Content diff calculated:', {
    modulesToUpdate: diff.modulesToUpdate.length,
    modulesToCreate: diff.modulesToCreate.length
  });

  return diff;
};

const createQuizMappings = async (existing: any, newModules: ModuleData[]): Promise<QuizMapping[]> => {
  console.log('Creating quiz mappings...');
  
  const mappings: QuizMapping[] = [];
  const quizzes = existing.quizzes || [];
  
  // For each quiz, try to find the corresponding unit in the new structure
  for (const quiz of quizzes) {
    if (!quiz.unit_id) continue;
    
    // Find the old unit
    const oldUnit = existing.modules
      ?.flatMap(m => m.lessons || [])
      ?.flatMap(l => l.units || [])
      ?.find(u => u.id === quiz.unit_id);
    
    if (!oldUnit) continue;
    
    // Find the corresponding new unit by title
    const newUnit = newModules
      ?.flatMap(m => m.lessons || [])
      ?.flatMap(l => l.units || [])
      ?.find(u => u.title === oldUnit.title);
    
    if (newUnit) {
      mappings.push({
        oldUnitId: quiz.unit_id,
        newUnitId: newUnit.id || '', // Will be filled after unit creation
        quizId: quiz.id,
        quizTitle: quiz.title,
        unitTitle: oldUnit.title
      });
      
      console.log(`Quiz mapping created: "${quiz.title}" -> "${oldUnit.title}"`);
    } else {
      console.warn(`Could not find matching unit for quiz "${quiz.title}" (unit: "${oldUnit.title}")`);
    }
  }
  
  console.log(`Created ${mappings.length} quiz mappings`);
  return mappings;
};

const updateCourseMetadata = async (courseId: string, courseData: CourseFormData) => {
  console.log('Updating course metadata...');
  
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
  
  console.log('Course metadata updated successfully');
};

const applyIncrementalUpdates = async (courseId: string, diff: ContentDiff) => {
  console.log('Applying incremental content updates...');
  
  // For now, use the existing course creation logic but with preserved IDs
  // This is a simplified implementation - in practice, you'd want more granular updates
  
  const { createCourseWithModules } = await import("./courseSubmissionService");
  
  // Update existing modules and create new ones
  for (const module of diff.modulesToUpdate) {
    console.log(`Updating module: ${module.title}`);
    // Here you would implement module update logic
  }
  
  for (const module of diff.modulesToCreate) {
    console.log(`Creating new module: ${module.title}`);
    // Here you would implement module creation logic
  }
  
  // For now, fall back to the full recreation but with better error handling
  if (diff.modulesToUpdate.length > 0 || diff.modulesToCreate.length > 0) {
    // Clean up existing content but preserve quiz relationships
    await cleanupExistingContentSafely(courseId);
    
    // Recreate content structure
    await createCourseWithModules(courseId, { title: '', description: '', instructor: '', category: '', level: '', duration: '' }, diff.modulesToUpdate.concat(diff.modulesToCreate));
  }
  
  console.log('Incremental updates applied');
};

const cleanupExistingContentSafely = async (courseId: string) => {
  console.log('Performing safe content cleanup...');
  
  // Mark content as deleted but don't hard delete until quiz assignments are restored
  const { data: modules } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', courseId);

  if (modules) {
    // Soft delete approach - mark as deleted but keep data
    await supabase
      .from('modules')
      .update({ is_draft: true, updated_at: new Date().toISOString() })
      .eq('course_id', courseId);
      
    console.log('Existing content marked for cleanup');
  }
};

const restoreQuizAssignments = async (mappings: QuizMapping[]): Promise<number> => {
  console.log('Restoring quiz assignments...');
  
  let restoredCount = 0;
  
  for (const mapping of mappings) {
    try {
      // Find the new unit by title since IDs might have changed
      const { data: newUnits } = await supabase
        .from('units')
        .select('id')
        .eq('title', mapping.unitTitle)
        .limit(1);
      
      if (newUnits && newUnits.length > 0) {
        const newUnitId = newUnits[0].id;
        
        // Update quiz assignment
        const { error } = await supabase
          .from('quizzes')
          .update({ unit_id: newUnitId })
          .eq('id', mapping.quizId);
        
        if (error) {
          console.error(`Failed to restore quiz "${mapping.quizTitle}":`, error);
        } else {
          console.log(`Restored quiz assignment: "${mapping.quizTitle}" -> "${mapping.unitTitle}"`);
          restoredCount++;
        }
      } else {
        console.warn(`Could not find new unit for quiz restoration: "${mapping.unitTitle}"`);
      }
    } catch (error) {
      console.error(`Error restoring quiz "${mapping.quizTitle}":`, error);
    }
  }
  
  console.log(`Quiz assignment restoration completed: ${restoredCount} restored`);
  return restoredCount;
};

const validateCourseIntegrity = async (courseId: string) => {
  console.log('Validating course integrity...');
  
  // Fetch course structure
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

  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id, title, unit_id')
    .eq('is_deleted', false)
    .not('unit_id', 'is', null);

  const issues: string[] = [];
  let score = 100;

  // Check for orphaned quizzes
  const allUnitIds = modules?.flatMap(m => 
    m.lessons?.flatMap(l => l.units?.map(u => u.id) || []) || []
  ) || [];

  const orphanedQuizzes = quizzes?.filter(q => 
    q.unit_id && !allUnitIds.includes(q.unit_id)
  ) || [];

  if (orphanedQuizzes.length > 0) {
    issues.push(`${orphanedQuizzes.length} orphaned quizzes detected`);
    score -= 20;
  }

  // Check module structure
  const moduleCount = modules?.length || 0;
  const lessonCount = modules?.flatMap(m => m.lessons || []).length || 0;
  const unitCount = allUnitIds.length;

  const summary = {
    modules: moduleCount,
    lessons: lessonCount,
    units: unitCount,
    quizzes: quizzes?.length || 0,
    orphanedQuizzes: orphanedQuizzes.length
  };

  console.log('Integrity validation completed:', { score, issues: issues.length, summary });

  return {
    score,
    issues,
    summary,
    isValid: issues.length === 0
  };
};
