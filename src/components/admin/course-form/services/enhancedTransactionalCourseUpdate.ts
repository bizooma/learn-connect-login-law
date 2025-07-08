import { supabase } from "@/integrations/supabase/client";
import { CourseFormData, ModuleData } from "../types";
import { uploadImageFile } from "../fileUploadUtils";
import { updateUnitsEnhanced, cleanupOrphanedUnits } from "./enhancedUnitUpdateService";
import { ensureSafeProgressCreation, validateProgressConsistency } from "./safeProgressService";

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
    // Phase 1: Pre-update validation and safety checks
    const phase1Start = Date.now();
    
    const progressValidation = await validateProgressConsistency(courseId);
    if (!progressValidation.isConsistent) {
      result.warnings.push(...progressValidation.issues.map(issue => `Pre-update: ${issue}`));
    }
    
    const existingStructure = await fetchExistingCourseStructure(courseId);
    const quizMappings = await createQuizMappings(existingStructure, modules);
    
    phaseTimings.phase1_validation = Date.now() - phase1Start;

    // Phase 2: Update course metadata safely
    const phase2Start = Date.now();
    
    await updateCourseMetadataSafely(courseId, courseData);
    phaseTimings.phase2_metadata = Date.now() - phase2Start;

    // Phase 3: Perform safe content replacement with transaction safety
    const phase3Start = Date.now();
    
    await performSafeContentReplacementEnhanced(courseId, modules);
    phaseTimings.phase3_content = Date.now() - phase3Start;

    // Phase 4: Restore quiz assignments using enhanced matching
    const phase4Start = Date.now();
    
    const quizRestoreCount = await restoreQuizAssignmentsByTitleEnhanced(quizMappings);
    result.quizAssignmentsRestored = quizRestoreCount;
    
    phaseTimings.phase4_quizzes = Date.now() - phase4Start;

    // Phase 5: Ensure safe progress creation and final validation
    const phase5Start = Date.now();
    
    // Get all users who should have access to this course
    const { data: assignedUsers } = await supabase
      .from('course_assignments')
      .select('user_id')
      .eq('course_id', courseId);
    
    if (assignedUsers && assignedUsers.length > 0) {
      const userIds = assignedUsers.map(a => a.user_id);
      const progressResult = await ensureSafeProgressCreation(courseId, userIds);
      
      if (!progressResult.success) {
        result.errors.push(...progressResult.errors);
      }
      result.warnings.push(...progressResult.warnings);
    }
    
    const validation = await validateCourseIntegrityWithDuplicateCheck(courseId);
    result.validationSummary = validation.summary;
    result.integrityScore = validation.score;
    
    if (validation.issues.length > 0) {
      result.warnings.push(...validation.issues);
    }
    
    phaseTimings.phase5_validation = Date.now() - phase5Start;

    // Success!
    result.success = true;
    result.courseId = courseId;
    
    const totalTime = Date.now() - startTime;
    result.performanceMetrics = {
      totalDurationMs: totalTime,
      phaseTimings
    };

    return result;

  } catch (error) {
    console.error('Enhanced course update failed:', error);
    result.errors.push(`Update failed: ${error.message}`);
    return result;
  }
};

const fetchExistingCourseStructure = async (courseId: string) => {
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

  return { modules: modules || [], quizzes: quizzes || [] };
};

const calculateContentDiff = (existing: any, newModules: ModuleData[]): ContentDiff => {
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

  return diff;
};

const createQuizMappings = async (existing: any, newModules: ModuleData[]): Promise<QuizMapping[]> => {
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
    } else {
      console.warn(`Could not find matching unit for quiz "${quiz.title}" (unit: "${oldUnit.title}")`);
    }
  }
  
  return mappings;
};

const updateCourseMetadataSafely = async (courseId: string, courseData: CourseFormData) => {
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
};

const performSafeContentReplacementEnhanced = async (courseId: string, modules: ModuleData[]) => {
  try {
    // Get all existing module IDs for this course
    const { data: existingModules } = await supabase
      .from('modules')
      .select('id')
      .eq('course_id', courseId);

    if (existingModules && existingModules.length > 0) {
      const moduleIds = existingModules.map(m => m.id);
      
      // Get all lesson IDs for these modules
      const { data: existingLessons } = await supabase
        .from('lessons')
        .select('id')
        .in('module_id', moduleIds);

      if (existingLessons && existingLessons.length > 0) {
        const lessonIds = existingLessons.map(l => l.id);
        
        // Delete all units first (to maintain referential integrity)
        const { error: unitDeleteError } = await supabase
          .from('units')
          .delete()
          .in('section_id', lessonIds);
          
        if (unitDeleteError) {
          throw new Error(`Failed to delete existing units: ${unitDeleteError.message}`);
        }
      }

      // Delete all lessons
      const { error: lessonDeleteError } = await supabase
        .from('lessons')
        .delete()
        .in('module_id', moduleIds);
        
      if (lessonDeleteError) {
        throw new Error(`Failed to delete existing lessons: ${lessonDeleteError.message}`);
      }

      // Delete all modules
      const { error: moduleDeleteError } = await supabase
        .from('modules')
        .delete()
        .eq('course_id', courseId);
        
      if (moduleDeleteError) {
        throw new Error(`Failed to delete existing modules: ${moduleDeleteError.message}`);
      }
    }

    // Now create the new content structure using enhanced methods
    await createCourseContentEnhanced(courseId, modules);
    
  } catch (error) {
    console.error('Error during safe content replacement:', error);
    throw new Error(`Content replacement failed: ${error.message}`);
  }
};

const createCourseContentEnhanced = async (courseId: string, modules: ModuleData[]) => {
  for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
    const module = modules[moduleIndex];
    
    // Create module
    const { data: moduleData, error: moduleError } = await supabase
      .from('modules')
      .insert({
        course_id: courseId,
        title: module.title,
        description: module.description,
        image_url: module.image_url,
        sort_order: moduleIndex
      })
      .select()
      .single();
      
    if (moduleError) {
      throw new Error(`Failed to create module: ${moduleError.message}`);
    }
    
    // Create lessons for this module
    for (let lessonIndex = 0; lessonIndex < module.lessons.length; lessonIndex++) {
      const lesson = module.lessons[lessonIndex];
      
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          course_id: courseId,
          module_id: moduleData.id,
          title: lesson.title,
          description: lesson.description,
          image_url: lesson.image_url,
          video_url: lesson.video_url || null,
          video_type: lesson.video_type || 'youtube',
          file_url: lesson.file_url,
          file_name: lesson.file_name,
          file_size: lesson.file_size,
          duration_minutes: lesson.duration_minutes || null,
          sort_order: lessonIndex
        })
        .select()
        .single();
        
      if (lessonError) {
        throw new Error(`Failed to create lesson: ${lessonError.message}`);
      }
      
      // Create units for this lesson using enhanced method
      if (lesson.units && lesson.units.length > 0) {
        const unitResults = await updateUnitsEnhanced(lessonData.id, lesson.units);
        
        // Check for any critical unit creation failures
        const failedUnits = unitResults.filter(r => !r.success);
        if (failedUnits.length > 0) {
          console.warn(`${failedUnits.length} units failed to create properly`);
        }
      }
    }
  }
};

const restoreQuizAssignmentsByTitleEnhanced = async (mappings: QuizMapping[]): Promise<number> => {
  let restoredCount = 0;
  
  for (const mapping of mappings) {
    try {
      // Find the new unit by exact title match
      const { data: matchingUnits } = await supabase
        .from('units')
        .select('id, title')
        .eq('title', mapping.unitTitle)
        .limit(1);
      
      if (matchingUnits && matchingUnits.length > 0) {
        const newUnitId = matchingUnits[0].id;
        
        // Check if this quiz still exists and isn't already assigned
        const { data: existingQuiz } = await supabase
          .from('quizzes')
          .select('id, unit_id, title')
          .eq('id', mapping.quizId)
          .eq('is_deleted', false)
          .single();
        
        if (existingQuiz) {
          // Update quiz assignment to new unit with conflict handling
          const { error } = await supabase
            .from('quizzes')
            .update({ 
              unit_id: newUnitId,
              updated_at: new Date().toISOString()
            })
            .eq('id', mapping.quizId);
          
          if (error) {
            console.error(`Failed to restore quiz "${mapping.quizTitle}":`, error);
          } else {
            restoredCount++;
          }
        } else {
          console.warn(`Quiz "${mapping.quizTitle}" no longer exists or was deleted`);
        }
      } else {
        console.warn(`Could not find matching unit for quiz: "${mapping.unitTitle}"`);
      }
    } catch (error) {
      console.error(`Error restoring quiz "${mapping.quizTitle}":`, error);
    }
  }
  
  return restoredCount;
};

const validateCourseIntegrityWithDuplicateCheck = async (courseId: string) => {
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
  const warnings: string[] = [];
  let score = 100;
  let duplicateCount = 0;

  // Check for duplicate modules
  if (modules) {
    const moduleTitles = modules.map(m => m.title.toLowerCase().trim());
    const duplicateModules = moduleTitles.filter((title, index) => 
      moduleTitles.indexOf(title) !== index
    );
    
    if (duplicateModules.length > 0) {
      duplicateCount += duplicateModules.length;
      issues.push(`Found ${duplicateModules.length} duplicate modules`);
      score -= 30;
    }

    // Check for duplicate lessons within modules
    modules.forEach(module => {
      if (module.lessons) {
        const lessonTitles = module.lessons.map(l => l.title.toLowerCase().trim());
        const duplicateLessons = lessonTitles.filter((title, index) => 
          lessonTitles.indexOf(title) !== index
        );
        
        if (duplicateLessons.length > 0) {
          duplicateCount += duplicateLessons.length;
          warnings.push(`Module "${module.title}" has ${duplicateLessons.length} duplicate lessons`);
          score -= 10;
        }

        // Check for duplicate units within lessons
        module.lessons.forEach(lesson => {
          if (lesson.units) {
            const unitTitles = lesson.units.map(u => u.title.toLowerCase().trim());
            const duplicateUnits = unitTitles.filter((title, index) => 
              unitTitles.indexOf(title) !== index
            );
            
            if (duplicateUnits.length > 0) {
              duplicateCount += duplicateUnits.length;
              warnings.push(`Lesson "${lesson.title}" has ${duplicateUnits.length} duplicate units`);
              score -= 5;
            }
          }
        });
      }
    });
  }

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

  // Calculate summary
  const moduleCount = modules?.length || 0;
  const lessonCount = modules?.flatMap(m => m.lessons || []).length || 0;
  const unitCount = allUnitIds.length;

  const summary = {
    modules: moduleCount,
    lessons: lessonCount,
    units: unitCount,
    quizzes: quizzes?.length || 0,
    orphanedQuizzes: orphanedQuizzes.length,
    duplicatesFound: duplicateCount
  };

  return {
    score: Math.max(0, score),
    issues,
    warnings,
    summary,
    isValid: issues.length === 0,
    duplicateCount
  };
};
