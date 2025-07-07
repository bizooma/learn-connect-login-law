
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

export interface CourseBackupData {
  backupId: string;
  courseId: string;
  timestamp: string;
  modules: any[];
  lessons: any[];
  units: any[];
  quizzes: any[];
}

export interface BackupResult {
  success: boolean;
  backupData?: CourseBackupData;
  error?: string;
}

export const createCourseBackup = async (courseId: string): Promise<BackupResult> => {
  try {
    logger.log('Creating course backup for:', courseId);
    
    // Fetch complete course structure
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
      return { success: false, error: `Failed to backup modules: ${modulesError.message}` };
    }

    // Fetch quiz assignments
    const allUnits = modules?.flatMap(m => 
      m.lessons?.flatMap(l => l.units || []) || []
    ) || [];

    const { data: quizzes, error: quizzesError } = await supabase
      .from('quizzes')
      .select('*')
      .in('unit_id', allUnits.map(u => u.id))
      .eq('is_deleted', false);

    if (quizzesError) {
      logger.warn('Failed to backup quizzes:', quizzesError);
    }

    const backupData: CourseBackupData = {
      backupId: `backup_${courseId}_${Date.now()}`,
      courseId,
      timestamp: new Date().toISOString(),
      modules: modules || [],
      lessons: modules?.flatMap(m => m.lessons || []) || [],
      units: allUnits,
      quizzes: quizzes || []
    };

    logger.log('Course backup created:', {
      backupId: backupData.backupId,
      modules: backupData.modules.length,
      lessons: backupData.lessons.length,
      units: backupData.units.length,
      quizzes: backupData.quizzes.length
    });

    return { success: true, backupData };

  } catch (error) {
    logger.error('Error creating course backup:', error);
    return { success: false, error: error.message };
  }
};

export const validateCourseIntegrity = async (courseId: string) => {
  try {
    logger.log('Validating course integrity for:', courseId);
    
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
    const allUnitIds = modules?.flatMap(m => 
      m.lessons?.flatMap(l => l.units?.map(u => u.id) || []) || []
    ) || [];

    // Check for orphaned quizzes
    const orphanedQuizzes = quizzes?.filter(q => 
      q.unit_id && !allUnitIds.includes(q.unit_id)
    ) || [];

    if (orphanedQuizzes.length > 0) {
      issues.push(`Found ${orphanedQuizzes.length} orphaned quizzes`);
    }

    // Check for empty modules
    const emptyModules = modules?.filter(m => !m.lessons || m.lessons.length === 0) || [];
    if (emptyModules.length > 0) {
      issues.push(`Found ${emptyModules.length} empty modules`);
    }

    const summary = {
      modules: modules?.length || 0,
      lessons: modules?.flatMap(m => m.lessons || []).length || 0,
      units: allUnitIds.length,
      quizzes: quizzes?.length || 0,
      orphanedQuizzes: orphanedQuizzes.length
    };

    logger.log('Integrity validation completed:', { issues: issues.length, summary });

    return {
      isValid: issues.length === 0,
      issues,
      summary
    };

  } catch (error) {
    logger.error('Error validating course integrity:', error);
    return {
      isValid: false,
      issues: [`Validation failed: ${error.message}`],
      summary: {}
    };
  }
};
