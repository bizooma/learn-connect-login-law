
import { supabase } from "@/integrations/supabase/client";
import { ModuleData } from "../types";
import { logger } from "@/utils/logger";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  integrityScore: number;
}

export interface CourseStructureValidation {
  modulesValid: boolean;
  lessonsValid: boolean;
  unitsValid: boolean;
  sortOrderValid: boolean;
  contentIntegrityValid: boolean;
  quizAssignmentValid: boolean;
}

export const validateCourseStructure = async (
  courseId: string,
  proposedModules: ModuleData[]
): Promise<ValidationResult> => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
    integrityScore: 100
  };

  try {
    logger.log('Enhanced course structure validation started');

    // Validate basic structure requirements
    if (proposedModules.length === 0) {
      result.errors.push('Course must have at least one module');
      result.integrityScore -= 20;
    }

    // Check for empty modules
    const emptyModules = proposedModules.filter(m => m.lessons.length === 0);
    if (emptyModules.length > 0) {
      result.warnings.push(`${emptyModules.length} modules have no lessons`);
      result.integrityScore -= 5 * emptyModules.length;
    }

    // Check for empty lessons
    let emptyLessonsCount = 0;
    proposedModules.forEach(module => {
      const emptyLessons = module.lessons.filter(l => l.units.length === 0);
      emptyLessonsCount += emptyLessons.length;
    });

    if (emptyLessonsCount > 0) {
      result.warnings.push(`${emptyLessonsCount} lessons have no units`);
      result.integrityScore -= 3 * emptyLessonsCount;
    }

    // Validate sort orders
    const sortOrderValidation = validateSortOrders(proposedModules);
    if (!sortOrderValidation.isValid) {
      result.warnings.push(...sortOrderValidation.issues);
      result.integrityScore -= 10;
    }

    // Check for duplicate titles at each level
    const duplicateChecks = checkForDuplicateTitles(proposedModules);
    if (duplicateChecks.length > 0) {
      result.warnings.push(...duplicateChecks);
      result.integrityScore -= 5 * duplicateChecks.length;
    }

    // Validate quiz assignments
    const quizValidation = await validateQuizAssignments(courseId, proposedModules);
    if (!quizValidation.isValid) {
      result.warnings.push(...quizValidation.warnings);
      result.errors.push(...quizValidation.errors);
      result.integrityScore -= quizValidation.penaltyScore;
    }

    // Check content completeness
    const contentValidation = validateContentCompleteness(proposedModules);
    result.suggestions.push(...contentValidation.suggestions);
    result.integrityScore -= contentValidation.penaltyScore;

    result.isValid = result.errors.length === 0 && result.integrityScore >= 60;

    logger.log('Enhanced validation completed:', {
      isValid: result.isValid,
      integrityScore: result.integrityScore,
      errors: result.errors.length,
      warnings: result.warnings.length,
      suggestions: result.suggestions.length
    });

    return result;
  } catch (error) {
    logger.error('Error in enhanced course validation:', error);
    result.errors.push(`Validation failed: ${error.message}`);
    result.isValid = false;
    return result;
  }
};

const validateSortOrders = (modules: ModuleData[]): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  // Check module sort orders
  const moduleSortOrders = modules.map(m => m.sort_order);
  const uniqueModuleSorts = new Set(moduleSortOrders);
  if (uniqueModuleSorts.size !== moduleSortOrders.length) {
    issues.push('Duplicate sort orders found in modules');
  }

  // Check lesson sort orders within each module
  modules.forEach((module, moduleIndex) => {
    const lessonSortOrders = module.lessons.map(l => l.sort_order);
    const uniqueLessonSorts = new Set(lessonSortOrders);
    if (uniqueLessonSorts.size !== lessonSortOrders.length) {
      issues.push(`Module "${module.title}" has duplicate lesson sort orders`);
    }

    // Check unit sort orders within each lesson
    module.lessons.forEach((lesson, lessonIndex) => {
      const unitSortOrders = lesson.units.map(u => u.sort_order);
      const uniqueUnitSorts = new Set(unitSortOrders);
      if (uniqueUnitSorts.size !== unitSortOrders.length) {
        issues.push(`Lesson "${lesson.title}" has duplicate unit sort orders`);
      }
    });
  });

  return { isValid: issues.length === 0, issues };
};

const checkForDuplicateTitles = (modules: ModuleData[]): string[] => {
  const issues: string[] = [];
  
  // Check module titles
  const moduleTitles = modules.map(m => m.title.toLowerCase().trim());
  const duplicateModules = moduleTitles.filter((title, index) => 
    moduleTitles.indexOf(title) !== index
  );
  if (duplicateModules.length > 0) {
    issues.push('Duplicate module titles found');
  }

  // Check lesson titles within modules
  modules.forEach(module => {
    const lessonTitles = module.lessons.map(l => l.title.toLowerCase().trim());
    const duplicateLessons = lessonTitles.filter((title, index) => 
      lessonTitles.indexOf(title) !== index
    );
    if (duplicateLessons.length > 0) {
      issues.push(`Module "${module.title}" has duplicate lesson titles`);
    }

    // Check unit titles within lessons
    module.lessons.forEach(lesson => {
      const unitTitles = lesson.units.map(u => u.title.toLowerCase().trim());
      const duplicateUnits = unitTitles.filter((title, index) => 
        unitTitles.indexOf(title) !== index
      );
      if (duplicateUnits.length > 0) {
        issues.push(`Lesson "${lesson.title}" has duplicate unit titles`);
      }
    });
  });

  return issues;
};

const validateQuizAssignments = async (
  courseId: string, 
  modules: ModuleData[]
): Promise<{ isValid: boolean; errors: string[]; warnings: string[]; penaltyScore: number }> => {
  const result = { isValid: true, errors: [], warnings: [], penaltyScore: 0 };

  try {
    // Get all quiz assignments for the course
    const { data: existingQuizzes, error } = await supabase
      .from('quizzes')
      .select('id, title, unit_id')
      .not('unit_id', 'is', null)
      .eq('is_deleted', false);

    if (error) {
      result.errors.push(`Failed to validate quiz assignments: ${error.message}`);
      result.penaltyScore = 15;
      return result;
    }

    // Get all unit IDs from proposed structure
    const allProposedUnitIds = modules.flatMap(m => 
      m.lessons.flatMap(l => l.units.map(u => u.id).filter(Boolean))
    );

    // Check for orphaned quiz assignments
    const orphanedQuizzes = existingQuizzes?.filter(quiz => 
      quiz.unit_id && !allProposedUnitIds.includes(quiz.unit_id)
    ) || [];

    if (orphanedQuizzes.length > 0) {
      result.warnings.push(`${orphanedQuizzes.length} quiz assignments may become orphaned`);
      result.penaltyScore += 5 * orphanedQuizzes.length;
    }

    // Check for units with quiz_id but no matching quiz
    let invalidQuizReferences = 0;
    modules.forEach(module => {
      module.lessons.forEach(lesson => {
        lesson.units.forEach(unit => {
          if (unit.quiz_id && !existingQuizzes?.some(q => q.id === unit.quiz_id)) {
            invalidQuizReferences++;
          }
        });
      });
    });

    if (invalidQuizReferences > 0) {
      result.warnings.push(`${invalidQuizReferences} units reference non-existent quizzes`);
      result.penaltyScore += 3 * invalidQuizReferences;
    }

    result.isValid = result.errors.length === 0;
    return result;
  } catch (error) {
    result.errors.push(`Quiz validation failed: ${error.message}`);
    result.penaltyScore = 20;
    return result;
  }
};

const validateContentCompleteness = (modules: ModuleData[]): { suggestions: string[]; penaltyScore: number } => {
  const suggestions: string[] = [];
  let penaltyScore = 0;

  // Check for units without content
  let unitsWithoutContent = 0;
  let unitsWithoutVideo = 0;
  let unitsWithoutDescription = 0;

  modules.forEach(module => {
    module.lessons.forEach(lesson => {
      lesson.units.forEach(unit => {
        if (!unit.content || unit.content.trim().length === 0) {
          unitsWithoutContent++;
        }
        if (!unit.video_url || unit.video_url.trim().length === 0) {
          unitsWithoutVideo++;
        }
        if (!unit.description || unit.description.trim().length === 0) {
          unitsWithoutDescription++;
        }
      });
    });
  });

  if (unitsWithoutContent > 0) {
    suggestions.push(`${unitsWithoutContent} units have no content description`);
    penaltyScore += 2;
  }

  if (unitsWithoutVideo > 0) {
    suggestions.push(`${unitsWithoutVideo} units have no video content`);
    penaltyScore += 3;
  }

  if (unitsWithoutDescription > 0) {
    suggestions.push(`${unitsWithoutDescription} units have no description`);
    penaltyScore += 1;
  }

  return { suggestions, penaltyScore };
};

export const generateValidationReport = (validation: ValidationResult): string => {
  const lines: string[] = [];
  
  lines.push(`=== COURSE VALIDATION REPORT ===`);
  lines.push(`Overall Status: ${validation.isValid ? 'VALID' : 'INVALID'}`);
  lines.push(`Integrity Score: ${validation.integrityScore}/100`);
  lines.push('');

  if (validation.errors.length > 0) {
    lines.push('ERRORS:');
    validation.errors.forEach(error => lines.push(`  ❌ ${error}`));
    lines.push('');
  }

  if (validation.warnings.length > 0) {
    lines.push('WARNINGS:');
    validation.warnings.forEach(warning => lines.push(`  ⚠️ ${warning}`));
    lines.push('');
  }

  if (validation.suggestions.length > 0) {
    lines.push('SUGGESTIONS:');
    validation.suggestions.forEach(suggestion => lines.push(`  💡 ${suggestion}`));
    lines.push('');
  }

  return lines.join('\n');
};
