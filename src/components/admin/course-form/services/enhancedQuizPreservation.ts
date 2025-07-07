
import { supabase } from "@/integrations/supabase/client";
import { ModuleData } from "../types";
import { logger } from "@/utils/logger";

export interface QuizAssignmentData {
  quizId: string;
  unitId: string;
  quizTitle: string;
  unitTitle: string;
  moduleTitle: string;
  lessonTitle: string;
}

export interface QuizPreservationResult {
  success: boolean;
  preservedAssignments: QuizAssignmentData[];
  errors: string[];
  warnings: string[];
}

export const preserveQuizAssignmentsEnhanced = async (courseId: string): Promise<QuizPreservationResult> => {
  const result: QuizPreservationResult = {
    success: false,
    preservedAssignments: [],
    errors: [],
    warnings: []
  };

  try {
    logger.log('🎯 Starting enhanced quiz assignment preservation for course:', courseId);
    
    // Fetch complete course structure with quiz assignments
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select(`
        *,
        lessons:lessons(
          *,
          units:units(*)
        )
      `)
      .eq('course_id', courseId);

    if (modulesError) {
      result.errors.push(`Failed to fetch course structure: ${modulesError.message}`);
      return result;
    }

    if (!modules || modules.length === 0) {
      result.warnings.push('No modules found in course');
      result.success = true;
      return result;
    }

    // Collect all units with hierarchy information
    const unitHierarchy = new Map<string, { unit: any; lesson: any; module: any }>();
    
    modules.forEach(module => {
      module.lessons?.forEach(lesson => {
        lesson.units?.forEach(unit => {
          unitHierarchy.set(unit.id, { unit, lesson, module });
        });
      });
    });

    logger.log(`Found ${unitHierarchy.size} units in course hierarchy`);

    // Fetch all quiz assignments for these units
    const unitIds = Array.from(unitHierarchy.keys());
    
    if (unitIds.length === 0) {
      result.warnings.push('No units found for quiz preservation');
      result.success = true;
      return result;
    }

    const { data: quizzes, error: quizzesError } = await supabase
      .from('quizzes')
      .select('id, title, unit_id, description')
      .in('unit_id', unitIds)
      .eq('is_deleted', false)
      .not('unit_id', 'is', null);

    if (quizzesError) {
      result.errors.push(`Failed to fetch quiz assignments: ${quizzesError.message}`);
      return result;
    }

    logger.log(`Found ${quizzes?.length || 0} active quiz assignments`);

    // Create enhanced preservation data
    const preservedAssignments: QuizAssignmentData[] = [];
    
    quizzes?.forEach(quiz => {
      const hierarchy = unitHierarchy.get(quiz.unit_id!);
      if (hierarchy) {
        preservedAssignments.push({
          quizId: quiz.id,
          unitId: quiz.unit_id!,
          quizTitle: quiz.title,
          unitTitle: hierarchy.unit.title,
          moduleTitle: hierarchy.module.title,
          lessonTitle: hierarchy.lesson.title
        });
        
        logger.log(`✅ Preserved: Quiz "${quiz.title}" -> Unit "${hierarchy.unit.title}" in Module "${hierarchy.module.title}"`);
      } else {
        result.warnings.push(`Could not find hierarchy for quiz "${quiz.title}" (unit_id: ${quiz.unit_id})`);
      }
    });

    result.preservedAssignments = preservedAssignments;
    result.success = true;
    
    logger.log(`🎯 Enhanced quiz preservation completed: ${preservedAssignments.length} assignments preserved`);
    
    return result;

  } catch (error) {
    logger.error('💥 Error in enhanced quiz preservation:', error);
    result.errors.push(`Preservation failed: ${error.message}`);
    return result;
  }
};

export const restoreQuizAssignmentsEnhanced = async (
  courseId: string,
  preservedAssignments: QuizAssignmentData[],
  newModules: ModuleData[]
): Promise<QuizPreservationResult> => {
  const result: QuizPreservationResult = {
    success: false,
    preservedAssignments: [],
    errors: [],
    warnings: []
  };

  try {
    logger.log('🔄 Starting enhanced quiz assignment restoration for course:', courseId);
    logger.log(`Attempting to restore ${preservedAssignments.length} quiz assignments`);

    if (preservedAssignments.length === 0) {
      result.success = true;
      logger.log('No quiz assignments to restore');
      return result;
    }

    // Fetch the current course structure after content recreation
    const { data: currentModules, error: fetchError } = await supabase
      .from('modules')
      .select(`
        *,
        lessons:lessons(
          *,
          units:units(*)
        )
      `)
      .eq('course_id', courseId);

    if (fetchError) {
      result.errors.push(`Failed to fetch current course structure: ${fetchError.message}`);
      return result;
    }

    if (!currentModules || currentModules.length === 0) {
      result.errors.push('No modules found in recreated course structure');
      return result;
    }

    // Create a comprehensive mapping system
    const unitMapping = new Map<string, string>(); // old unit id -> new unit id
    
    // Strategy 1: Match by hierarchy path (module -> lesson -> unit titles)
    preservedAssignments.forEach(preserved => {
      // Find matching module
      const matchingModule = currentModules.find(m => m.title === preserved.moduleTitle);
      if (!matchingModule) {
        result.warnings.push(`Could not find module "${preserved.moduleTitle}" for quiz "${preserved.quizTitle}"`);
        return;
      }

      // Find matching lesson
      const matchingLesson = matchingModule.lessons?.find(l => l.title === preserved.lessonTitle);
      if (!matchingLesson) {
        result.warnings.push(`Could not find lesson "${preserved.lessonTitle}" in module "${preserved.moduleTitle}" for quiz "${preserved.quizTitle}"`);
        return;
      }

      // Find matching unit
      const matchingUnit = matchingLesson.units?.find(u => u.title === preserved.unitTitle);
      if (!matchingUnit) {
        result.warnings.push(`Could not find unit "${preserved.unitTitle}" in lesson "${preserved.lessonTitle}" for quiz "${preserved.quizTitle}"`);
        return;
      }

      unitMapping.set(preserved.unitId, matchingUnit.id);
      logger.log(`📍 Mapped unit: "${preserved.unitTitle}" (${preserved.unitId} -> ${matchingUnit.id})`);
    });

    logger.log(`Successfully mapped ${unitMapping.size} out of ${preservedAssignments.length} units`);

    // Restore quiz assignments
    let restoredCount = 0;
    
    for (const preserved of preservedAssignments) {
      const newUnitId = unitMapping.get(preserved.unitId);
      
      if (!newUnitId) {
        result.errors.push(`Could not map unit for quiz "${preserved.quizTitle}"`);
        continue;
      }

      try {
        const { error: updateError } = await supabase
          .from('quizzes')
          .update({ 
            unit_id: newUnitId,
            updated_at: new Date().toISOString()
          })
          .eq('id', preserved.quizId);

        if (updateError) {
          result.errors.push(`Failed to restore quiz "${preserved.quizTitle}": ${updateError.message}`);
        } else {
          logger.log(`✅ Restored quiz assignment: "${preserved.quizTitle}" -> "${preserved.unitTitle}"`);
          restoredCount++;
          result.preservedAssignments.push(preserved);
        }
      } catch (error) {
        result.errors.push(`Error restoring quiz "${preserved.quizTitle}": ${error.message}`);
      }
    }

    result.success = restoredCount > 0 || preservedAssignments.length === 0;
    
    console.log(`🔄 Enhanced quiz restoration completed: ${restoredCount}/${preservedAssignments.length} assignments restored`);
    
    if (result.errors.length > 0) {
      console.warn('⚠️ Quiz restoration errors:', result.errors);
    }
    
    if (result.warnings.length > 0) {
      console.warn('⚠️ Quiz restoration warnings:', result.warnings);
    }

    return result;

  } catch (error) {
    console.error('💥 Error in enhanced quiz restoration:', error);
    result.errors.push(`Restoration failed: ${error.message}`);
    return result;
  }
};
