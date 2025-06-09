
import { supabase } from "@/integrations/supabase/client";
import { ModuleData } from "../types";

export interface QuizAssignmentData {
  quizId: string;
  unitId: string;
  unitTitle: string;
  unitDescription: string;
  quizTitle: string;
  quizDescription?: string;
  moduleTitle: string;
  lessonTitle: string;
  unitSortOrder: number;
  lessonSortOrder: number;
  moduleSortOrder: number;
}

export interface QuizPreservationResult {
  success: boolean;
  preservedAssignments: QuizAssignmentData[];
  errors: string[];
  warnings: string[];
}

export const preserveQuizAssignmentsEnhanced = async (
  courseId: string
): Promise<QuizPreservationResult> => {
  const result: QuizPreservationResult = {
    success: false,
    preservedAssignments: [],
    errors: [],
    warnings: []
  };

  try {
    console.log('Enhanced quiz preservation started for course:', courseId);

    // Get comprehensive course structure with quiz assignments
    const { data: courseStructure, error: structureError } = await supabase
      .from('modules')
      .select(`
        id,
        title,
        sort_order,
        lessons:lessons(
          id,
          title,
          sort_order,
          units:units(
            id,
            title,
            description,
            sort_order,
            quizzes:quizzes(
              id,
              title,
              description,
              passing_score,
              time_limit_minutes,
              is_active,
              is_deleted
            )
          )
        )
      `)
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true });

    if (structureError) {
      result.errors.push(`Failed to fetch course structure: ${structureError.message}`);
      return result;
    }

    if (!courseStructure || courseStructure.length === 0) {
      result.warnings.push('No modules found for course');
      result.success = true;
      return result;
    }

    // Extract quiz assignments with full context
    for (const module of courseStructure) {
      for (const lesson of module.lessons || []) {
        for (const unit of lesson.units || []) {
          for (const quiz of unit.quizzes || []) {
            if (!quiz.is_deleted && quiz.is_active) {
              result.preservedAssignments.push({
                quizId: quiz.id,
                unitId: unit.id,
                unitTitle: unit.title,
                unitDescription: unit.description || '',
                quizTitle: quiz.title,
                quizDescription: quiz.description,
                moduleTitle: module.title,
                lessonTitle: lesson.title,
                unitSortOrder: unit.sort_order,
                lessonSortOrder: lesson.sort_order,
                moduleSortOrder: module.sort_order
              });

              console.log(`Preserved quiz assignment: "${quiz.title}" -> Unit "${unit.title}" in "${lesson.title}" > "${module.title}"`);
            }
          }
        }
      }
    }

    result.success = true;
    console.log(`Enhanced quiz preservation completed. Found ${result.preservedAssignments.length} assignments`);
    
    return result;
  } catch (error) {
    console.error('Error in enhanced quiz preservation:', error);
    result.errors.push(`Unexpected error: ${error.message}`);
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
    console.log('Enhanced quiz restoration started for course:', courseId);
    console.log('Assignments to restore:', preservedAssignments.length);

    if (preservedAssignments.length === 0) {
      result.success = true;
      result.warnings.push('No quiz assignments to restore');
      return result;
    }

    // Get current course structure after recreation
    const { data: currentStructure, error: structureError } = await supabase
      .from('modules')
      .select(`
        id,
        title,
        sort_order,
        lessons:lessons(
          id,
          title,
          sort_order,
          units:units(id, title, description, sort_order)
        )
      `)
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true });

    if (structureError) {
      result.errors.push(`Failed to fetch current structure: ${structureError.message}`);
      return result;
    }

    // Create mapping strategies for finding units
    const unitMappingStrategies = [
      // Strategy 1: Exact title match within same lesson/module structure
      (assignment: QuizAssignmentData) => {
        for (const module of currentStructure || []) {
          if (module.title === assignment.moduleTitle && module.sort_order === assignment.moduleSortOrder) {
            for (const lesson of module.lessons || []) {
              if (lesson.title === assignment.lessonTitle && lesson.sort_order === assignment.lessonSortOrder) {
                for (const unit of lesson.units || []) {
                  if (unit.title === assignment.unitTitle && unit.sort_order === assignment.unitSortOrder) {
                    return unit.id;
                  }
                }
              }
            }
          }
        }
        return null;
      },
      
      // Strategy 2: Title and description match (relaxed structure)
      (assignment: QuizAssignmentData) => {
        for (const module of currentStructure || []) {
          for (const lesson of module.lessons || []) {
            for (const unit of lesson.units || []) {
              if (unit.title === assignment.unitTitle && 
                  (unit.description || '').trim() === assignment.unitDescription.trim()) {
                return unit.id;
              }
            }
          }
        }
        return null;
      },

      // Strategy 3: Title only match (last resort)
      (assignment: QuizAssignmentData) => {
        for (const module of currentStructure || []) {
          for (const lesson of module.lessons || []) {
            for (const unit of lesson.units || []) {
              if (unit.title === assignment.unitTitle) {
                return unit.id;
              }
            }
          }
        }
        return null;
      }
    ];

    // Restore quiz assignments using mapping strategies
    for (const assignment of preservedAssignments) {
      let newUnitId: string | null = null;
      let strategyUsed = 0;

      // Try each strategy until one works
      for (let i = 0; i < unitMappingStrategies.length; i++) {
        newUnitId = unitMappingStrategies[i](assignment);
        if (newUnitId) {
          strategyUsed = i + 1;
          break;
        }
      }

      if (newUnitId) {
        // Restore the quiz assignment
        const { error: updateError } = await supabase
          .from('quizzes')
          .update({ unit_id: newUnitId })
          .eq('id', assignment.quizId);

        if (updateError) {
          result.errors.push(`Failed to restore quiz "${assignment.quizTitle}": ${updateError.message}`);
        } else {
          result.preservedAssignments.push({
            ...assignment,
            unitId: newUnitId
          });
          console.log(`Successfully restored quiz "${assignment.quizTitle}" to unit "${assignment.unitTitle}" using strategy ${strategyUsed}`);
        }
      } else {
        result.warnings.push(`Could not find matching unit for quiz "${assignment.quizTitle}" (original unit: "${assignment.unitTitle}")`);
      }
    }

    result.success = true;
    console.log(`Enhanced quiz restoration completed. Restored ${result.preservedAssignments.length} assignments`);
    
    return result;
  } catch (error) {
    console.error('Error in enhanced quiz restoration:', error);
    result.errors.push(`Unexpected error: ${error.message}`);
    return result;
  }
};
