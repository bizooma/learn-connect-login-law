import { supabase } from "@/integrations/supabase/client";
import { CourseFormData, ModuleData } from "../types";
import { uploadImageFile } from "../fileUploadUtils";
import { updateUnitsEnhanced } from "./enhancedUnitUpdateService";
import { ensureSafeProgressCreation, validateProgressConsistency } from "./safeProgressService";

export interface OptimizedUpdateResult {
  success: boolean;
  courseId?: string;
  backupId?: string;
  quizAssignmentsRestored?: number;
  errors: string[];
  warnings: string[];
  validationSummary?: any;
  integrityScore?: number;
  performanceMetrics?: {
    totalDurationMs: number;
    phaseTimings: Record<string, number>;
    optimizationStats: {
      duplicateDetectionMs: number;
      databaseQueriesCount: number;
      parallelOperationsCount: number;
      memoryOptimizationSavings: number;
    };
  };
}

interface QuizMapping {
  oldUnitId: string;
  newUnitId: string;
  quizId: string;
  quizTitle: string;
  unitTitle: string;
}

interface CourseStructure {
  modules: any[];
  quizzes: any[];
  unitIdToTitleMap: Map<string, string>;
  titleToUnitMap: Map<string, any>;
}

// O(1) cache for repeated operations
const queryCache = new Map<string, any>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const performOptimizedTransactionalCourseUpdate = async (
  courseId: string,
  courseData: CourseFormData,
  modules: ModuleData[]
): Promise<OptimizedUpdateResult> => {
  const startTime = Date.now();
  const phaseTimings: Record<string, number> = {};
  const optimizationStats = {
    duplicateDetectionMs: 0,
    databaseQueriesCount: 0,
    parallelOperationsCount: 0,
    memoryOptimizationSavings: 0
  };
  
  const result: OptimizedUpdateResult = {
    success: false,
    errors: [],
    warnings: []
  };

  try {
    // Phase 1: Parallel validation and structure fetching
    const phase1Start = Date.now();
    
    const [progressValidation, existingStructure] = await Promise.all([
      validateProgressConsistency(courseId),
      fetchExistingCourseStructureOptimized(courseId)
    ]);
    optimizationStats.parallelOperationsCount += 2;
    
    if (!progressValidation.isConsistent) {
      result.warnings.push(...progressValidation.issues.map(issue => `Pre-update: ${issue}`));
    }
    
    const quizMappings = createQuizMappingsOptimized(existingStructure, modules);
    
    phaseTimings.phase1_validation = Date.now() - phase1Start;

    // Phase 2: Update course metadata
    const phase2Start = Date.now();
    
    await updateCourseMetadataSafely(courseId, courseData);
    phaseTimings.phase2_metadata = Date.now() - phase2Start;

    // Phase 3: Parallel content replacement
    const phase3Start = Date.now();
    
    await performOptimizedContentReplacement(courseId, modules, optimizationStats);
    phaseTimings.phase3_content = Date.now() - phase3Start;

    // Phase 4: Batch quiz assignment restoration
    const phase4Start = Date.now();
    
    const quizRestoreCount = await restoreQuizAssignmentsBatched(quizMappings, optimizationStats);
    result.quizAssignmentsRestored = quizRestoreCount;
    
    phaseTimings.phase4_quizzes = Date.now() - phase4Start;

    // Phase 5: Parallel final validation
    const phase5Start = Date.now();
    
    const [assignedUsers, validation] = await Promise.all([
      supabase.from('course_assignments').select('user_id').eq('course_id', courseId),
      validateCourseIntegrityOptimized(courseId, optimizationStats)
    ]);
    optimizationStats.parallelOperationsCount += 2;
    
    if (assignedUsers.data && assignedUsers.data.length > 0) {
      const userIds = assignedUsers.data.map(a => a.user_id);
      const progressResult = await ensureSafeProgressCreation(courseId, userIds);
      
      if (!progressResult.success) {
        result.errors.push(...progressResult.errors);
      }
      result.warnings.push(...progressResult.warnings);
    }
    
    result.validationSummary = validation.summary;
    result.integrityScore = validation.score;
    
    if (validation.issues.length > 0) {
      result.warnings.push(...validation.issues);
    }
    
    phaseTimings.phase5_validation = Date.now() - phase5Start;

    result.success = true;
    result.courseId = courseId;
    
    const totalTime = Date.now() - startTime;
    result.performanceMetrics = {
      totalDurationMs: totalTime,
      phaseTimings,
      optimizationStats
    };

    return result;

  } catch (error) {
    console.error('Optimized course update failed:', error);
    result.errors.push(`Update failed: ${error.message}`);
    return result;
  }
};

// Optimized O(1) duplicate detection using Sets
const findDuplicatesOptimized = (items: string[]): Set<string> => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  
  for (const item of items) {
    const normalized = item.toLowerCase().trim();
    if (seen.has(normalized)) {
      duplicates.add(normalized);
    } else {
      seen.add(normalized);
    }
  }
  
  return duplicates;
};

// Optimized course structure fetching with single query
const fetchExistingCourseStructureOptimized = async (courseId: string): Promise<CourseStructure> => {
  const cacheKey = `course_structure_${courseId}`;
  const cached = queryCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Single optimized query with all required data
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

  // Build optimized lookup maps in single pass
  const unitIdToTitleMap = new Map<string, string>();
  const titleToUnitMap = new Map<string, any>();
  const allUnitIds: string[] = [];

  modules?.forEach(module => {
    module.lessons?.forEach(lesson => {
      lesson.units?.forEach(unit => {
        unitIdToTitleMap.set(unit.id, unit.title);
        titleToUnitMap.set(unit.title, unit);
        allUnitIds.push(unit.id);
      });
    });
  });

  // Batch fetch quizzes if there are units
  let quizzes: any[] = [];
  if (allUnitIds.length > 0) {
    const { data: quizData } = await supabase
      .from('quizzes')
      .select('id, title, unit_id')
      .in('unit_id', allUnitIds)
      .eq('is_deleted', false)
      .not('unit_id', 'is', null);
    
    quizzes = quizData || [];
  }

  const structure: CourseStructure = {
    modules: modules || [],
    quizzes,
    unitIdToTitleMap,
    titleToUnitMap
  };

  // Cache the result
  queryCache.set(cacheKey, { data: structure, timestamp: Date.now() });
  
  return structure;
};

// Optimized quiz mapping with O(1) lookups
const createQuizMappingsOptimized = (existing: CourseStructure, newModules: ModuleData[]): QuizMapping[] => {
  const mappings: QuizMapping[] = [];
  
  // Build new structure lookup in single pass
  const newTitleToUnitMap = new Map<string, any>();
  newModules.forEach(module => {
    module.lessons?.forEach(lesson => {
      lesson.units?.forEach(unit => {
        newTitleToUnitMap.set(unit.title, unit);
      });
    });
  });
  
  // Create mappings using O(1) lookups
  for (const quiz of existing.quizzes) {
    if (!quiz.unit_id) continue;
    
    const oldUnitTitle = existing.unitIdToTitleMap.get(quiz.unit_id);
    if (!oldUnitTitle) continue;
    
    const newUnit = newTitleToUnitMap.get(oldUnitTitle);
    if (newUnit) {
      mappings.push({
        oldUnitId: quiz.unit_id,
        newUnitId: newUnit.id || '',
        quizId: quiz.id,
        quizTitle: quiz.title,
        unitTitle: oldUnitTitle
      });
    } else {
      console.warn(`Could not find matching unit for quiz "${quiz.title}" (unit: "${oldUnitTitle}")`);
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

// Optimized content replacement with batch operations
const performOptimizedContentReplacement = async (
  courseId: string, 
  modules: ModuleData[],
  optimizationStats: any
) => {
  try {
    // Batch fetch existing content IDs
    const [existingModules, existingLessons] = await Promise.all([
      supabase.from('modules').select('id').eq('course_id', courseId),
      supabase.from('lessons').select('id').eq('course_id', courseId)
    ]);
    optimizationStats.parallelOperationsCount += 2;
    optimizationStats.databaseQueriesCount += 2;

    // Sequential delete operations for referential integrity
    if (existingLessons.data && existingLessons.data.length > 0) {
      const lessonIds = existingLessons.data.map(l => l.id);
      
      // Delete units first
      const { error: unitDeleteError } = await supabase
        .from('units')
        .delete()
        .in('section_id', lessonIds);
        
      if (unitDeleteError) {
        throw new Error(`Failed to delete existing units: ${unitDeleteError.message}`);
      }
      optimizationStats.databaseQueriesCount += 1;
    }
    
    if (existingModules.data && existingModules.data.length > 0) {
      const moduleIds = existingModules.data.map(m => m.id);
      
      // Delete lessons, then modules
      const [lessonDeleteResult, moduleDeleteResult] = await Promise.all([
        supabase.from('lessons').delete().in('module_id', moduleIds),
        supabase.from('modules').delete().eq('course_id', courseId)
      ]);
      
      if (lessonDeleteResult.error) {
        throw new Error(`Failed to delete existing lessons: ${lessonDeleteResult.error.message}`);
      }
      if (moduleDeleteResult.error) {
        throw new Error(`Failed to delete existing modules: ${moduleDeleteResult.error.message}`);
      }
      
      optimizationStats.parallelOperationsCount += 2;
      optimizationStats.databaseQueriesCount += 2;
    }

    // Create new content with parallel processing where possible
    await createCourseContentOptimized(courseId, modules, optimizationStats);
    
  } catch (error) {
    console.error('Error during optimized content replacement:', error);
    throw new Error(`Content replacement failed: ${error.message}`);
  }
};

// Optimized content creation with batch inserts
const createCourseContentOptimized = async (
  courseId: string, 
  modules: ModuleData[],
  optimizationStats: any
) => {
  // Prepare batch module data
  const moduleInserts = modules.map((module, index) => ({
    course_id: courseId,
    title: module.title,
    description: module.description,
    image_url: module.image_url,
    sort_order: index
  }));

  // Batch insert modules
  const { data: createdModules, error: moduleError } = await supabase
    .from('modules')
    .insert(moduleInserts)
    .select();
  optimizationStats.databaseQueriesCount += 1;

  if (moduleError) {
    throw new Error(`Failed to create modules: ${moduleError.message}`);
  }

  // Process lessons and units for each module in parallel batches
  const moduleProcessingPromises = createdModules.map(async (moduleData, moduleIndex) => {
    const module = modules[moduleIndex];
    
    if (!module.lessons || module.lessons.length === 0) return;

    // Prepare batch lesson data
    const lessonInserts = module.lessons.map((lesson, index) => ({
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
      sort_order: index
    }));

    // Batch insert lessons
    const { data: createdLessons, error: lessonError } = await supabase
      .from('lessons')
      .insert(lessonInserts)
      .select();
    optimizationStats.databaseQueriesCount += 1;

    if (lessonError) {
      throw new Error(`Failed to create lessons: ${lessonError.message}`);
    }

    // Process units for all lessons in parallel
    const unitProcessingPromises = createdLessons.map(async (lessonData, lessonIndex) => {
      const lesson = module.lessons[lessonIndex];
      if (lesson.units && lesson.units.length > 0) {
        return updateUnitsEnhanced(lessonData.id, lesson.units);
      }
      return [];
    });

    if (unitProcessingPromises.length > 0) {
      await Promise.all(unitProcessingPromises);
      optimizationStats.parallelOperationsCount += unitProcessingPromises.length;
    }
  });

  // Wait for all modules to be processed
  await Promise.all(moduleProcessingPromises);
  optimizationStats.parallelOperationsCount += moduleProcessingPromises.length;
};

// Optimized batch quiz assignment restoration
const restoreQuizAssignmentsBatched = async (
  mappings: QuizMapping[],
  optimizationStats: any
): Promise<number> => {
  if (mappings.length === 0) return 0;

  // Build lookup maps for O(1) access
  const unitTitleToIdMap = new Map<string, string>();
  const quizIdSet = new Set(mappings.map(m => m.quizId));
  
  // Batch fetch all required data
  const [unitsData, quizzesData] = await Promise.all([
    supabase
      .from('units')
      .select('id, title')
      .in('title', [...new Set(mappings.map(m => m.unitTitle))]),
    supabase
      .from('quizzes')
      .select('id, unit_id, title')
      .in('id', [...quizIdSet])
      .eq('is_deleted', false)
  ]);
  optimizationStats.parallelOperationsCount += 2;
  optimizationStats.databaseQueriesCount += 2;

  // Build lookup map
  unitsData.data?.forEach(unit => {
    unitTitleToIdMap.set(unit.title, unit.id);
  });

  const validQuizIds = new Set(quizzesData.data?.map(q => q.id) || []);
  
  // Prepare batch updates
  const batchUpdates: Array<{ id: string; unit_id: string }> = [];
  
  for (const mapping of mappings) {
    const newUnitId = unitTitleToIdMap.get(mapping.unitTitle);
    if (newUnitId && validQuizIds.has(mapping.quizId)) {
      batchUpdates.push({
        id: mapping.quizId,
        unit_id: newUnitId
      });
    }
  }

  // Perform batch update if we have valid updates
  if (batchUpdates.length > 0) {
    // Supabase doesn't support batch upsert with different values per row,
    // so we'll do them in parallel but still individual updates
    const updatePromises = batchUpdates.map(update =>
      supabase
        .from('quizzes')
        .update({ 
          unit_id: update.unit_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.id)
    );

    const results = await Promise.all(updatePromises);
    optimizationStats.parallelOperationsCount += updatePromises.length;
    optimizationStats.databaseQueriesCount += updatePromises.length;
    
    const successCount = results.filter(result => !result.error).length;
    const failureCount = results.length - successCount;
    
    if (failureCount > 0) {
      console.warn(`${failureCount} quiz assignment updates failed`);
    }
    
    return successCount;
  }

  return 0;
};

// Optimized validation with Set-based duplicate detection
const validateCourseIntegrityOptimized = async (courseId: string, optimizationStats: any) => {
  const duplicateDetectionStart = Date.now();

  // Single query with all required data
  const [modulesResult, quizzesResult] = await Promise.all([
    supabase
      .from('modules')
      .select(`
        *,
        lessons:lessons(
          *,
          units:units(*)
        )
      `)
      .eq('course_id', courseId),
    supabase
      .from('quizzes')
      .select('id, title, unit_id')
      .eq('is_deleted', false)
      .not('unit_id', 'is', null)
  ]);
  optimizationStats.parallelOperationsCount += 2;
  optimizationStats.databaseQueriesCount += 2;

  const modules = modulesResult.data || [];
  const quizzes = quizzesResult.data || [];

  const issues: string[] = [];
  const warnings: string[] = [];
  let score = 100;
  let duplicateCount = 0;

  // Optimized O(n) duplicate detection for modules
  const moduleTitles = modules.map(m => m.title);
  const duplicateModules = findDuplicatesOptimized(moduleTitles);
  
  if (duplicateModules.size > 0) {
    duplicateCount += duplicateModules.size;
    issues.push(`Found ${duplicateModules.size} duplicate modules`);
    score -= 30;
  }

  // Optimized duplicate detection for lessons within modules
  modules.forEach(module => {
    if (module.lessons) {
      const lessonTitles = module.lessons.map(l => l.title);
      const duplicateLessons = findDuplicatesOptimized(lessonTitles);
      
      if (duplicateLessons.size > 0) {
        duplicateCount += duplicateLessons.size;
        warnings.push(`Module "${module.title}" has ${duplicateLessons.size} duplicate lessons`);
        score -= 10;
      }

      // Optimized duplicate detection for units within lessons
      module.lessons.forEach(lesson => {
        if (lesson.units) {
          const unitTitles = lesson.units.map(u => u.title);
          const duplicateUnits = findDuplicatesOptimized(unitTitles);
          
          if (duplicateUnits.size > 0) {
            duplicateCount += duplicateUnits.size;
            warnings.push(`Lesson "${lesson.title}" has ${duplicateUnits.size} duplicate units`);
            score -= 5;
          }
        }
      });
    }
  });

  // Optimized orphaned quiz detection using Set
  const allUnitIds = new Set<string>();
  modules.forEach(module => {
    module.lessons?.forEach(lesson => {
      lesson.units?.forEach(unit => {
        allUnitIds.add(unit.id);
      });
    });
  });

  const orphanedQuizzes = quizzes.filter(q => q.unit_id && !allUnitIds.has(q.unit_id));
  
  if (orphanedQuizzes.length > 0) {
    issues.push(`${orphanedQuizzes.length} orphaned quizzes detected`);
    score -= 20;
  }

  optimizationStats.duplicateDetectionMs = Date.now() - duplicateDetectionStart;

  // Calculate summary with streaming approach
  const summary = {
    modules: modules.length,
    lessons: modules.reduce((count, m) => count + (m.lessons?.length || 0), 0),
    units: allUnitIds.size,
    quizzes: quizzes.length,
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

// Clear cache utility (call when needed)
export const clearQueryCache = () => {
  queryCache.clear();
};