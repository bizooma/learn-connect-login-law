
import { supabase } from "@/integrations/supabase/client";
import { CourseFormData, ModuleData } from "../types";
import { createCourseBackup, validateCourseIntegrity, CourseBackupData } from "./courseBackupService";
import { preserveQuizAssignmentsEnhanced, restoreQuizAssignmentsEnhanced, QuizAssignmentData } from "./enhancedQuizPreservation";
import { createCourseWithModules } from "./courseSubmissionService";
import { cleanupExistingCourseContent } from "./courseContentCleanup";

export interface TransactionResult {
  success: boolean;
  courseId?: string;
  backupId?: string;
  quizAssignmentsRestored?: number;
  errors: string[];
  warnings: string[];
  validationSummary?: any;
}

export const performTransactionalCourseUpdate = async (
  courseId: string,
  courseData: CourseFormData,
  modules: ModuleData[]
): Promise<TransactionResult> => {
  const result: TransactionResult = {
    success: false,
    errors: [],
    warnings: []
  };

  let backupData: CourseBackupData | undefined;
  let preservedQuizzes: QuizAssignmentData[] = [];

  try {
    console.log('Starting transactional course update for:', courseId);

    // Phase 1: Pre-update validation and backup
    console.log('Phase 1: Validation and backup');
    
    const preValidation = await validateCourseIntegrity(courseId);
    if (!preValidation.isValid) {
      result.warnings.push(...preValidation.issues);
    }

    const backupResult = await createCourseBackup(courseId);
    if (!backupResult.success) {
      result.errors.push(`Backup failed: ${backupResult.error}`);
      return result;
    }

    backupData = backupResult.backupData!;
    result.backupId = backupData.backupId;
    console.log('Backup completed:', result.backupId);

    // Phase 2: Enhanced quiz preservation
    console.log('Phase 2: Quiz preservation');
    
    const quizPreservation = await preserveQuizAssignmentsEnhanced(courseId);
    if (!quizPreservation.success) {
      result.errors.push(...quizPreservation.errors);
      result.warnings.push(...quizPreservation.warnings);
      return result;
    }

    preservedQuizzes = quizPreservation.preservedAssignments;
    console.log(`Preserved ${preservedQuizzes.length} quiz assignments`);

    // Phase 3: Course basic info update
    console.log('Phase 3: Course basic info update');
    
    const courseUpdateData: any = {
      title: courseData.title,
      description: courseData.description,
      instructor: courseData.instructor,
      category: courseData.category,
      level: courseData.level,
      duration: courseData.duration,
      updated_at: new Date().toISOString(),
    };

    // Handle image upload if provided
    if (courseData.image_file) {
      try {
        const { uploadImageFile } = await import("../fileUploadUtils");
        courseUpdateData.image_url = await uploadImageFile(courseData.image_file);
      } catch (error) {
        result.warnings.push(`Image upload failed: ${error.message}`);
      }
    }

    const { error: courseUpdateError } = await supabase
      .from('courses')
      .update(courseUpdateData)
      .eq('id', courseId);

    if (courseUpdateError) {
      result.errors.push(`Course update failed: ${courseUpdateError.message}`);
      return result;
    }

    // Phase 4: Content cleanup and recreation
    console.log('Phase 4: Content cleanup and recreation');
    
    await cleanupExistingCourseContent(courseId);
    
    if (modules.length > 0) {
      await createCourseWithModules(courseId, courseData, modules);
    }

    // Phase 5: Quiz assignment restoration
    console.log('Phase 5: Quiz assignment restoration');
    
    const quizRestoration = await restoreQuizAssignmentsEnhanced(courseId, preservedQuizzes, modules);
    if (!quizRestoration.success) {
      result.errors.push(...quizRestoration.errors);
      result.warnings.push(...quizRestoration.warnings);
    } else {
      result.quizAssignmentsRestored = quizRestoration.preservedAssignments.length;
      console.log(`Restored ${result.quizAssignmentsRestored} quiz assignments`);
    }

    // Phase 6: Post-update validation
    console.log('Phase 6: Post-update validation');
    
    const postValidation = await validateCourseIntegrity(courseId);
    result.validationSummary = postValidation.summary;
    
    if (!postValidation.isValid) {
      result.warnings.push(...postValidation.issues.map(issue => `Post-update: ${issue}`));
    }

    result.success = true;
    result.courseId = courseId;
    
    console.log('Transactional course update completed successfully:', {
      courseId,
      modulesCreated: modules.length,
      quizAssignmentsRestored: result.quizAssignmentsRestored,
      validationSummary: result.validationSummary
    });

    return result;

  } catch (error) {
    console.error('Critical error in transactional course update:', error);
    result.errors.push(`Critical error: ${error.message}`);
    
    // If we have a backup and something went wrong, log rollback information
    if (backupData) {
      result.warnings.push(`Backup available for manual rollback: ${result.backupId}`);
      console.error('Rollback data available:', {
        backupId: result.backupId,
        originalModules: backupData.modules.length,
        originalLessons: backupData.lessons.length,
        originalUnits: backupData.units.length
      });
    }

    return result;
  }
};

export const validateTransactionResult = (result: TransactionResult): {
  isValid: boolean;
  criticalIssues: string[];
  recommendations: string[];
} => {
  const criticalIssues: string[] = [];
  const recommendations: string[] = [];

  if (!result.success) {
    criticalIssues.push('Transaction failed');
  }

  if (result.errors.length > 0) {
    criticalIssues.push(`${result.errors.length} errors occurred`);
  }

  if (result.warnings.length > 5) {
    recommendations.push('High number of warnings - consider reviewing course structure');
  }

  if (result.quizAssignmentsRestored === 0 && result.validationSummary?.quizAssignments > 0) {
    criticalIssues.push('Quiz assignments may have been lost');
  }

  return {
    isValid: criticalIssues.length === 0,
    criticalIssues,
    recommendations
  };
};
