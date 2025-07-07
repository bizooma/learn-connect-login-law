
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

export interface UpdateMetrics {
  updateId: string;
  courseId: string;
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
  success: boolean;
  modulesProcessed: number;
  lessonsProcessed: number;
  unitsProcessed: number;
  quizAssignmentsPreserved: number;
  quizAssignmentsRestored: number;
  errors: string[];
  warnings: string[];
  performanceMetrics: {
    backupDurationMs: number;
    preservationDurationMs: number;
    updateDurationMs: number;
    restorationDurationMs: number;
    validationDurationMs: number;
  };
}

export interface UpdatePerformanceMonitor {
  startUpdate: (courseId: string) => string;
  recordPhase: (updateId: string, phase: string, durationMs: number) => void;
  recordMetric: (updateId: string, metric: string, value: number) => void;
  recordError: (updateId: string, error: string, phase?: string) => void;
  recordWarning: (updateId: string, warning: string, phase?: string) => void;
  completeUpdate: (updateId: string, success: boolean) => UpdateMetrics;
  getMetrics: (updateId: string) => UpdateMetrics | null;
}

class UpdateMonitoringService implements UpdatePerformanceMonitor {
  private activeUpdates = new Map<string, UpdateMetrics>();
  private phaseTimers = new Map<string, Map<string, number>>();

  startUpdate(courseId: string): string {
    const updateId = `update_${courseId}_${Date.now()}`;
    const metrics: UpdateMetrics = {
      updateId,
      courseId,
      startTime: new Date(),
      success: false,
      modulesProcessed: 0,
      lessonsProcessed: 0,
      unitsProcessed: 0,
      quizAssignmentsPreserved: 0,
      quizAssignmentsRestored: 0,
      errors: [],
      warnings: [],
      performanceMetrics: {
        backupDurationMs: 0,
        preservationDurationMs: 0,
        updateDurationMs: 0,
        restorationDurationMs: 0,
        validationDurationMs: 0
      }
    };

    this.activeUpdates.set(updateId, metrics);
    this.phaseTimers.set(updateId, new Map());

    logger.log(`📊 Update monitoring started: ${updateId}`);
    return updateId;
  }

  recordPhase(updateId: string, phase: string, durationMs: number): void {
    const metrics = this.activeUpdates.get(updateId);
    if (!metrics) return;

    // Store phase timing
    const phaseTimers = this.phaseTimers.get(updateId);
    if (phaseTimers) {
      phaseTimers.set(phase, durationMs);
    }

    // Update performance metrics
    switch (phase) {
      case 'backup':
        metrics.performanceMetrics.backupDurationMs = durationMs;
        break;
      case 'preservation':
        metrics.performanceMetrics.preservationDurationMs = durationMs;
        break;
      case 'update':
        metrics.performanceMetrics.updateDurationMs = durationMs;
        break;
      case 'restoration':
        metrics.performanceMetrics.restorationDurationMs = durationMs;
        break;
      case 'validation':
        metrics.performanceMetrics.validationDurationMs = durationMs;
        break;
    }

    logger.log(`⏱️ Phase '${phase}' completed in ${durationMs}ms`);
  }

  recordMetric(updateId: string, metric: string, value: number): void {
    const metrics = this.activeUpdates.get(updateId);
    if (!metrics) return;

    switch (metric) {
      case 'modulesProcessed':
        metrics.modulesProcessed = value;
        break;
      case 'lessonsProcessed':
        metrics.lessonsProcessed = value;
        break;
      case 'unitsProcessed':
        metrics.unitsProcessed = value;
        break;
      case 'quizAssignmentsPreserved':
        metrics.quizAssignmentsPreserved = value;
        break;
      case 'quizAssignmentsRestored':
        metrics.quizAssignmentsRestored = value;
        break;
    }

    logger.log(`📈 Metric '${metric}': ${value}`);
  }

  recordError(updateId: string, error: string, phase?: string): void {
    const metrics = this.activeUpdates.get(updateId);
    if (!metrics) return;

    const errorMsg = phase ? `[${phase}] ${error}` : error;
    metrics.errors.push(errorMsg);
    logger.error(`❌ Update error: ${errorMsg}`);
  }

  recordWarning(updateId: string, warning: string, phase?: string): void {
    const metrics = this.activeUpdates.get(updateId);
    if (!metrics) return;

    const warningMsg = phase ? `[${phase}] ${warning}` : warning;
    metrics.warnings.push(warningMsg);
    logger.warn(`⚠️ Update warning: ${warningMsg}`);
  }

  completeUpdate(updateId: string, success: boolean): UpdateMetrics {
    const metrics = this.activeUpdates.get(updateId);
    if (!metrics) {
      throw new Error(`Update metrics not found for ID: ${updateId}`);
    }

    metrics.endTime = new Date();
    metrics.durationMs = metrics.endTime.getTime() - metrics.startTime.getTime();
    metrics.success = success;

    // Generate performance summary
    this.logPerformanceSummary(metrics);

    // Clean up
    this.activeUpdates.delete(updateId);
    this.phaseTimers.delete(updateId);

    return metrics;
  }

  getMetrics(updateId: string): UpdateMetrics | null {
    return this.activeUpdates.get(updateId) || null;
  }

  private logPerformanceSummary(metrics: UpdateMetrics): void {
    console.log(`📊 === UPDATE PERFORMANCE SUMMARY ===`);
    console.log(`Update ID: ${metrics.updateId}`);
    console.log(`Course ID: ${metrics.courseId}`);
    console.log(`Success: ${metrics.success}`);
    console.log(`Total Duration: ${metrics.durationMs}ms`);
    console.log(`Content Processed:`);
    console.log(`  - Modules: ${metrics.modulesProcessed}`);
    console.log(`  - Lessons: ${metrics.lessonsProcessed}`);
    console.log(`  - Units: ${metrics.unitsProcessed}`);
    console.log(`Quiz Assignments:`);
    console.log(`  - Preserved: ${metrics.quizAssignmentsPreserved}`);
    console.log(`  - Restored: ${metrics.quizAssignmentsRestored}`);
    console.log(`Phase Timings:`);
    console.log(`  - Backup: ${metrics.performanceMetrics.backupDurationMs}ms`);
    console.log(`  - Preservation: ${metrics.performanceMetrics.preservationDurationMs}ms`);
    console.log(`  - Update: ${metrics.performanceMetrics.updateDurationMs}ms`);
    console.log(`  - Restoration: ${metrics.performanceMetrics.restorationDurationMs}ms`);
    console.log(`  - Validation: ${metrics.performanceMetrics.validationDurationMs}ms`);
    
    if (metrics.errors.length > 0) {
      console.log(`Errors (${metrics.errors.length}):`);
      metrics.errors.forEach(error => console.log(`  ❌ ${error}`));
    }
    
    if (metrics.warnings.length > 0) {
      console.log(`Warnings (${metrics.warnings.length}):`);
      metrics.warnings.forEach(warning => console.log(`  ⚠️ ${warning}`));
    }
    
    console.log(`=================================`);
  }
}

export const updateMonitor = new UpdateMonitoringService();

export const createPerformanceTimer = () => {
  const start = performance.now();
  return () => performance.now() - start;
};

export const measureAsync = async <T>(
  operation: () => Promise<T>,
  label: string
): Promise<{ result: T; durationMs: number }> => {
  const timer = createPerformanceTimer();
  console.log(`⏱️ Starting: ${label}`);
  
  try {
    const result = await operation();
    const durationMs = timer();
    console.log(`✅ Completed: ${label} (${durationMs.toFixed(2)}ms)`);
    return { result, durationMs };
  } catch (error) {
    const durationMs = timer();
    console.error(`❌ Failed: ${label} (${durationMs.toFixed(2)}ms)`, error);
    throw error;
  }
};
