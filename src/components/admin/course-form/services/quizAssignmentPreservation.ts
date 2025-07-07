
import { supabase } from "@/integrations/supabase/client";
import { ModuleData } from "../types";
import { logger } from "@/utils/logger";

interface QuizAssignment {
  quizId: string;
  unitId: string;
  quizTitle: string;
}

export const preserveQuizAssignments = async (courseId: string): Promise<QuizAssignment[]> => {
  try {
    logger.log('Preserving quiz assignments for course:', courseId);
    
    // Get all units in the course
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select(`
        lessons:lessons(
          units:units(id)
        )
      `)
      .eq('course_id', courseId);

    if (modulesError) {
      logger.error('Error fetching modules for quiz preservation:', modulesError);
      return [];
    }

    const allUnitIds = modules?.flatMap(m => 
      m.lessons?.flatMap(l => l.units?.map(u => u.id) || []) || []
    ) || [];

    if (allUnitIds.length === 0) {
      logger.log('No units found for quiz preservation');
      return [];
    }

    // Fetch quiz assignments
    const { data: quizzes, error: quizzesError } = await supabase
      .from('quizzes')
      .select('id, unit_id, title')
      .in('unit_id', allUnitIds)
      .eq('is_deleted', false)
      .not('unit_id', 'is', null);

    if (quizzesError) {
      logger.error('Error fetching quiz assignments for preservation:', quizzesError);
      return [];
    }

    const assignments: QuizAssignment[] = quizzes?.map(quiz => ({
      quizId: quiz.id,
      unitId: quiz.unit_id!,
      quizTitle: quiz.title
    })) || [];

    logger.log('Preserved quiz assignments:', assignments);
    return assignments;
  } catch (error) {
    logger.error('Error in preserveQuizAssignments:', error);
    return [];
  }
};

export const restoreQuizAssignments = async (
  courseId: string, 
  preservedAssignments: QuizAssignment[], 
  modules: ModuleData[]
) => {
  try {
    logger.log('Restoring quiz assignments for course:', courseId, 'Assignments:', preservedAssignments);
    
    if (preservedAssignments.length === 0) {
      logger.log('No quiz assignments to restore');
      return;
    }

    // Create a map of old unit IDs to new unit IDs based on titles
    const unitIdMap = new Map<string, string>();
    
    // Get all current units in the course after recreation
    const { data: currentModules, error: currentModulesError } = await supabase
      .from('modules')
      .select(`
        lessons:lessons(
          units:units(id, title)
        )
      `)
      .eq('course_id', courseId);

    if (currentModulesError) {
      logger.error('Error fetching current modules for restoration:', currentModulesError);
      return;
    }

    const currentUnits = currentModules?.flatMap(m => 
      m.lessons?.flatMap(l => l.units || []) || []
    ) || [];

    // Map old unit IDs to new unit IDs based on unit titles
    for (const assignment of preservedAssignments) {
      // Find the unit title from modules data
      const unitTitle = findUnitTitleInModules(modules, assignment.unitId);
      if (unitTitle) {
        const newUnit = currentUnits.find(u => u.title === unitTitle);
        if (newUnit) {
          unitIdMap.set(assignment.unitId, newUnit.id);
          logger.log(`Mapped unit "${unitTitle}": ${assignment.unitId} -> ${newUnit.id}`);
        }
      }
    }

    // Restore quiz assignments with new unit IDs
    for (const assignment of preservedAssignments) {
      const newUnitId = unitIdMap.get(assignment.unitId);
      if (newUnitId) {
        logger.log(`Restoring quiz assignment: Quiz "${assignment.quizTitle}" (${assignment.quizId}) -> Unit ${newUnitId}`);
        
        const { error: updateError } = await supabase
          .from('quizzes')
          .update({ unit_id: newUnitId })
          .eq('id', assignment.quizId);

        if (updateError) {
          logger.error(`Error restoring quiz assignment for ${assignment.quizId}:`, updateError);
        } else {
          console.log(`Successfully restored quiz assignment: ${assignment.quizId} -> ${newUnitId}`);
        }
      } else {
        console.warn(`Could not find new unit ID for quiz assignment: ${assignment.quizId}`);
      }
    }

    console.log('Quiz assignment restoration completed');
  } catch (error) {
    console.error('Error in restoreQuizAssignments:', error);
  }
};

const findUnitTitleInModules = (modules: ModuleData[], unitId: string): string | null => {
  for (const module of modules) {
    for (const lesson of module.lessons) {
      for (const unit of lesson.units) {
        if (unit.id === unitId) {
          return unit.title;
        }
      }
    }
  }
  return null;
};
