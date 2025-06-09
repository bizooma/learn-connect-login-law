
import { supabase } from "@/integrations/supabase/client";
import { CourseFormData, ModuleData } from "../types";
import { createCourseBackup, validateCourseIntegrity, CourseBackupData } from "./courseBackupService";
import { preserveQuizAssignmentsEnhanced, restoreQuizAssignmentsEnhanced, QuizAssignmentData } from "./enhancedQuizPreservation";
import { createCourseWithModules } from "./courseSubmissionService";
import { cleanupExistingCourseContent } from "./courseContentCleanup";
import { validateCourseStructure, generateValidationReport } from "./enhancedValidationService";
import { updateMonitor, measureAsync } from "./updateMonitoringService";

export interface EnhancedTransactionResult {
  success: boolean;
  courseId?: string;
  backupId?: string;
  updateId?: string;
  quizAssignmentsRestored?: number;
  errors: string[];
  warnings: string[];
  validationSummary?: any;
  validationReport?: string;
  performanceMetrics?: {
    totalDurationMs: number;
    backupDurationMs: number;
    preservationDurationMs: number;
    updateDurationMs: number;
    restorationDurationMs: number;
    validationDurationMs: number;
  };
  integrityScore?: number;
}

export const performEnhancedTransactionalCourseUpdate = async (
  courseId: string,
  courseData: CourseFormData,
  modules: ModuleData[]
): Promise<EnhancedTransactionResult> => {
  const result: EnhancedTransactionResult = {
    success: false,
    errors: [],
    warnings: []
  };

  // Start monitoring
  const updateId = updateMonitor.startUpdate(courseId);
  result.updateId = updateId;

  let backupData: CourseBackupData | undefined;
  let preservedQuizzes: QuizAssignmentData[] = [];

  try {
    console.log('🚀 Starting enhanced transactional course update for:', courseId);

    // Phase 1: Enhanced pre-update validation
    console.log('Phase 1: Enhanced pre-update validation');
    const { result: preValidation, durationMs: validationDuration } = await measureAsync(
      () => validateCourseStructure(courseId, modules),
      'Pre-update validation'
    );
    
    updateMonitor.recordPhase(updateId, 'validation', validationDuration);
    
    result.validationReport = generateValidationReport(preValidation);
    result.integrityScore = preValidation.integrityScore;
    
    if (!preValidation.isValid) {
      result.errors.push(...preValidation.errors);
      result.warnings.push(...preValidation.warnings);
      
      // Don't proceed if validation fails with critical errors
      if (preValidation.errors.length > 0) {
        updateMonitor.recordError(updateId, 'Pre-validation failed with critical errors');
        updateMonitor.completeUpdate(updateId, false);
        return result;
      }
    }

    result.warnings.push(...preValidation.warnings);

    // Phase 2: Create backup with performance monitoring
    console.log('Phase 2: Create backup');
    const { result: backupResult, durationMs: backupDuration } = await measureAsync(
      () => createCourseBackup(courseId),
      'Course backup'
    );
    
    updateMonitor.recordPhase(updateId, 'backup', backupDuration);
    
    if (!backupResult.success) {
      const error = `Backup failed: ${backupResult.error}`;
      result.errors.push(error);
      updateMonitor.recordError(updateId, error, 'backup');
      updateMonitor.completeUpdate(updateId, false);
      return result;
    }

    backupData = backupResult.backupData!;
    result.backupId = backupData.backupId;
    console.log('✅ Backup completed:', result.backupId);

    // Phase 3: Enhanced quiz preservation with monitoring
    console.log('Phase 3: Enhanced quiz preservation');
    const { result: quizPreservation, durationMs: preservationDuration } = await measureAsync(
      () => preserveQuizAssignmentsEnhanced(courseId),
      'Quiz preservation'
    );
    
    updateMonitor.recordPhase(updateId, 'preservation', preservationDuration);
    updateMonitor.recordMetric(updateId, 'quizAssignmentsPreserved', quizPreservation.preservedAssignments.length);
    
    if (!quizPreservation.success) {
      result.errors.push(...quizPreservation.errors);
      result.warnings.push(...quizPreservation.warnings);
      quizPreservation.errors.forEach(error => updateMonitor.recordError(updateId, error, 'preservation'));
      updateMonitor.completeUpdate(updateId, false);
      return result;
    }

    preservedQuizzes = quizPreservation.preservedAssignments;
    console.log(`✅ Preserved ${preservedQuizzes.length} quiz assignments`);

    // Phase 4: Course basic info update with monitoring
    console.log('Phase 4: Course basic info update');
    const { durationMs: courseUpdateDuration } = await measureAsync(async () => {
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
          const warning = `Image upload failed: ${error.message}`;
          result.warnings.push(warning);
          updateMonitor.recordWarning(updateId, warning, 'course-update');
        }
      }

      const { error: courseUpdateError } = await supabase
        .from('courses')
        .update(courseUpdateData)
        .eq('id', courseId);

      if (courseUpdateError) {
        throw new Error(`Course update failed: ${courseUpdateError.message}`);
      }
    }, 'Course basic info update');

    // Phase 5: Content cleanup and recreation with monitoring
    console.log('Phase 5: Content cleanup and recreation');
    const { durationMs: contentUpdateDuration } = await measureAsync(async () => {
      await cleanupExistingCourseContent(courseId);
      
      if (modules.length > 0) {
        await createCourseWithModules(courseId, courseData, modules);
      }
      
      updateMonitor.recordMetric(updateId, 'modulesProcessed', modules.length);
      updateMonitor.recordMetric(updateId, 'lessonsProcessed', modules.reduce((sum, m) => sum + m.lessons.length, 0));
      updateMonitor.recordMetric(updateId, 'unitsProcessed', modules.reduce((sum, m) => 
        sum + m.lessons.reduce((lessonSum, l) => lessonSum + l.units.length, 0), 0
      ));
    }, 'Content update');

    const totalUpdateDuration = courseUpdateDuration + contentUpdateDuration;
    updateMonitor.recordPhase(updateId, 'update', totalUpdateDuration);

    // Phase 6: Enhanced quiz assignment restoration with monitoring
    console.log('Phase 6: Enhanced quiz assignment restoration');
    const { result: quizRestoration, durationMs: restorationDuration } = await measureAsync(
      () => restoreQuizAssignmentsEnhanced(courseId, preservedQuizzes, modules),
      'Quiz restoration'
    );
    
    updateMonitor.recordPhase(updateId, 'restoration', restorationDuration);
    updateMonitor.recordMetric(updateId, 'quizAssignmentsRestored', quizRestoration.preservedAssignments.length);
    
    if (!quizRestoration.success) {
      result.errors.push(...quizRestoration.errors);
      result.warnings.push(...quizRestoration.warnings);
      quizRestoration.errors.forEach(error => updateMonitor.recordError(updateId, error, 'restoration'));
    } else {
      result.quizAssignmentsRestored = quizRestoration.preservedAssignments.length;
      console.log(`✅ Restored ${result.quizAssignmentsRestored} quiz assignments`);
    }

    // Phase 7: Post-update validation with monitoring
    console.log('Phase 7: Post-update validation');
    const { result: postValidation, durationMs: postValidationDuration } = await measureAsync(
      () => validateCourseIntegrity(courseId),
      'Post-update validation'
    );
    
    updateMonitor.recordPhase(updateId, 'validation', validationDuration + postValidationDuration);
    
    result.validationSummary = postValidation.summary;
    
    if (!postValidation.isValid) {
      const postValidationWarnings = postValidation.issues.map(issue => `Post-update: ${issue}`);
      result.warnings.push(...postValidationWarnings);
      postValidationWarnings.forEach(warning => updateMonitor.recordWarning(updateId, warning, 'post-validation'));
    }

    // Complete monitoring and set performance metrics
    const updateMetrics = updateMonitor.completeUpdate(updateId, true);
    result.performanceMetrics = {
      totalDurationMs: updateMetrics.durationMs || 0,
      backupDurationMs: updateMetrics.performanceMetrics.backupDurationMs,
      preservationDurationMs: updateMetrics.performanceMetrics.preservationDurationMs,
      updateDurationMs: updateMetrics.performanceMetrics.updateDurationMs,
      restorationDurationMs: updateMetrics.performanceMetrics.restorationDurationMs,
      validationDurationMs: updateMetrics.performanceMetrics.validationDurationMs
    };

    result.success = true;
    result.courseId = courseId;
    
    console.log('🎉 Enhanced transactional course update completed successfully:', {
      courseId,
      updateId,
      modulesCreated: modules.length,
      quizAssignmentsRestored: result.quizAssignmentsRestored,
      integrityScore: result.integrityScore,
      totalDuration: result.performanceMetrics.totalDurationMs,
      validationSummary: result.validationSummary
    });

    return result;

  } catch (error) {
    console.error('💥 Critical error in enhanced transactional course update:', error);
    const errorMessage = `Critical error: ${error.message}`;
    result.errors.push(errorMessage);
    updateMonitor.recordError(updateId, errorMessage);
    
    // If we have a backup and something went wrong, log rollback information
    if (backupData) {
      result.warnings.push(`Backup available for manual rollback: ${result.backupId}`);
      console.error('🔄 Rollback data available:', {
        backupId: result.backupId,
        originalModules: backupData.modules.length,
        originalLessons: backupData.lessons.length,
        originalUnits: backupData.units.length
      });
    }

    updateMonitor.completeUpdate(updateId, false);
    return result;
  }
};
