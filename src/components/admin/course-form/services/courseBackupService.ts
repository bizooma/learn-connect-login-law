
import { supabase } from "@/integrations/supabase/client";

export interface CourseBackupData {
  courseId: string;
  courseData: any;
  modules: any[];
  lessons: any[];
  units: any[];
  quizAssignments: any[];
  backupId: string;
  createdAt: string;
}

export interface BackupResult {
  success: boolean;
  backupData?: CourseBackupData;
  error?: string;
}

export const createCourseBackup = async (courseId: string): Promise<BackupResult> => {
  try {
    console.log('Creating course backup for:', courseId);

    // Fetch complete course data
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError) {
      return { success: false, error: `Failed to fetch course: ${courseError.message}` };
    }

    // Fetch modules with full structure
    const { data: modulesData, error: modulesError } = await supabase
      .from('modules')
      .select(`
        *,
        lessons:lessons(
          *,
          units:units(
            *,
            quizzes:quizzes(id, title, description, unit_id, is_active, is_deleted)
          )
        )
      `)
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true });

    if (modulesError) {
      return { success: false, error: `Failed to fetch modules: ${modulesError.message}` };
    }

    // Extract flattened data for backup
    const modules = modulesData || [];
    const lessons = modules.flatMap(m => m.lessons || []);
    const units = lessons.flatMap(l => l.units || []);
    const quizAssignments = units.flatMap(u => 
      (u.quizzes || []).map(q => ({
        quiz_id: q.id,
        unit_id: u.id,
        quiz_title: q.title,
        unit_title: u.title
      }))
    );

    const backupData: CourseBackupData = {
      courseId,
      courseData,
      modules: modules.map(({ lessons, ...module }) => module),
      lessons: lessons.map(({ units, ...lesson }) => lesson),
      units: units.map(({ quizzes, ...unit }) => unit),
      quizAssignments,
      backupId: `backup_${courseId}_${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    console.log('Course backup created successfully:', {
      modules: backupData.modules.length,
      lessons: backupData.lessons.length,
      units: backupData.units.length,
      quizAssignments: backupData.quizAssignments.length
    });

    return { success: true, backupData };
  } catch (error) {
    console.error('Error creating course backup:', error);
    return { success: false, error: `Backup failed: ${error.message}` };
  }
};

export const validateCourseIntegrity = async (courseId: string): Promise<{
  isValid: boolean;
  issues: string[];
  summary: {
    modules: number;
    lessons: number;
    units: number;
    quizAssignments: number;
  };
}> => {
  const issues: string[] = [];
  
  try {
    // Check course exists
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      issues.push('Course not found or inaccessible');
      return { isValid: false, issues, summary: { modules: 0, lessons: 0, units: 0, quizAssignments: 0 } };
    }

    // Check modules structure
    const { data: modules, error: modulesError } = await supabase
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
            sort_order
          )
        )
      `)
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true });

    if (modulesError) {
      issues.push(`Failed to fetch modules: ${modulesError.message}`);
      return { isValid: false, issues, summary: { modules: 0, lessons: 0, units: 0, quizAssignments: 0 } };
    }

    const totalLessons = modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0;
    const totalUnits = modules?.reduce((sum, m) => 
      sum + (m.lessons?.reduce((lessonSum, l) => lessonSum + (l.units?.length || 0), 0) || 0), 0
    ) || 0;

    // Check for orphaned records
    const { data: orphanedLessons } = await supabase
      .from('lessons')
      .select('id, title')
      .eq('course_id', courseId)
      .not('module_id', 'in', `(${modules?.map(m => m.id).join(',') || 'null'})`);

    if (orphanedLessons && orphanedLessons.length > 0) {
      issues.push(`Found ${orphanedLessons.length} orphaned lessons`);
    }

    // Check quiz assignments
    const { data: quizAssignments, error: quizError } = await supabase
      .from('quizzes')
      .select('id, title, unit_id')
      .not('unit_id', 'is', null)
      .eq('is_deleted', false);

    if (quizError) {
      issues.push(`Failed to check quiz assignments: ${quizError.message}`);
    }

    const allUnitIds = modules?.flatMap(m => 
      m.lessons?.flatMap(l => l.units?.map(u => u.id) || []) || []
    ) || [];

    const validQuizAssignments = quizAssignments?.filter(q => 
      q.unit_id && allUnitIds.includes(q.unit_id)
    ) || [];

    const summary = {
      modules: modules?.length || 0,
      lessons: totalLessons,
      units: totalUnits,
      quizAssignments: validQuizAssignments.length
    };

    console.log('Course integrity validation completed:', { courseId, summary, issues });

    return {
      isValid: issues.length === 0,
      issues,
      summary
    };
  } catch (error) {
    console.error('Error validating course integrity:', error);
    return {
      isValid: false,
      issues: [`Validation failed: ${error.message}`],
      summary: { modules: 0, lessons: 0, units: 0, quizAssignments: 0 }
    };
  }
};
