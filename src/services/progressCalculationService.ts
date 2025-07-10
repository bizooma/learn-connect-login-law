import { supabase } from "@/integrations/supabase/client";

interface CourseStructure {
  courseId: string;
  totalUnits: number;
  lessonIds: string[];
  lastCalculated: number;
}

interface ProgressData {
  courseProgress: Record<string, number>;
  unitProgress: Record<string, boolean>;
  videoProgress: Record<string, { percentage: number; completed: boolean }>;
  lastUpdated: number;
}

class ProgressCalculationService {
  private courseStructureCache = new Map<string, CourseStructure>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Centralized batch query for course structures
  async getCourseStructures(courseIds: string[]): Promise<Map<string, CourseStructure>> {
    const now = Date.now();
    const uncachedIds = courseIds.filter(id => {
      const cached = this.courseStructureCache.get(id);
      return !cached || (now - cached.lastCalculated) > this.CACHE_TTL;
    });

    if (uncachedIds.length > 0) {
      // Single optimized query for all course structures
      const { data: lessons, error } = await supabase
        .from('lessons')
        .select(`
          id,
          course_id,
          units!inner(id)
        `)
        .in('course_id', uncachedIds);

      if (error) throw error;

      // Group by course and cache results
      const courseStructures = new Map<string, { lessonIds: string[]; totalUnits: number }>();
      
      lessons?.forEach(lesson => {
        if (!courseStructures.has(lesson.course_id)) {
          courseStructures.set(lesson.course_id, { lessonIds: [], totalUnits: 0 });
        }
        const structure = courseStructures.get(lesson.course_id)!;
        structure.lessonIds.push(lesson.id);
        structure.totalUnits += lesson.units?.length || 0;
      });

      // Update cache
      courseStructures.forEach((structure, courseId) => {
        this.courseStructureCache.set(courseId, {
          courseId,
          totalUnits: structure.totalUnits,
          lessonIds: structure.lessonIds,
          lastCalculated: now
        });
      });
    }

    return this.courseStructureCache;
  }

  // Optimized batch progress calculation
  async calculateBatchProgress(userId: string, courseIds: string[]): Promise<Map<string, { percentage: number; status: string }>> {
    const structures = await this.getCourseStructures(courseIds);
    
    // Single query for all unit progress
    const { data: completedUnits, error } = await supabase
      .from('user_unit_progress')
      .select('course_id, unit_id')
      .eq('user_id', userId)
      .in('course_id', courseIds)
      .eq('completed', true);

    if (error) throw error;

    // Group completed units by course
    const completedByCourse = new Map<string, number>();
    completedUnits?.forEach(unit => {
      const count = completedByCourse.get(unit.course_id) || 0;
      completedByCourse.set(unit.course_id, count + 1);
    });

    // Calculate progress for each course
    const results = new Map<string, { percentage: number; status: string }>();
    
    courseIds.forEach(courseId => {
      const structure = structures.get(courseId);
      const completedCount = completedByCourse.get(courseId) || 0;
      const totalUnits = structure?.totalUnits || 0;
      
      const percentage = totalUnits > 0 ? Math.round((completedCount / totalUnits) * 100) : 0;
      const status = percentage === 100 ? 'completed' : percentage > 0 ? 'in_progress' : 'not_started';
      
      results.set(courseId, { percentage, status });
    });

    return results;
  }

  // Optimized single course progress calculation with caching
  async calculateCourseProgress(userId: string, courseId: string): Promise<{ percentage: number; status: string; totalUnits: number; completedUnits: number }> {
    const structures = await this.getCourseStructures([courseId]);
    const structure = structures.get(courseId);
    
    if (!structure) {
      return { percentage: 0, status: 'not_started', totalUnits: 0, completedUnits: 0 };
    }

    // Single optimized query for completed units
    const { count: completedCount, error } = await supabase
      .from('user_unit_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('completed', true);

    if (error) throw error;
    
    const totalUnits = structure.totalUnits;
    const percentage = totalUnits > 0 ? Math.round(((completedCount || 0) / totalUnits) * 100) : 0;
    const status = percentage === 100 ? 'completed' : percentage > 0 ? 'in_progress' : 'not_started';

    return {
      percentage,
      status,
      totalUnits,
      completedUnits: completedCount || 0
    };
  }

  // Batch update course progress efficiently
  async updateBatchCourseProgress(
    userId: string, 
    updates: Array<{ courseId: string; percentage: number; status: string }>
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    
    // Batch upsert all course progress updates
    const upsertData = updates.map(update => ({
      user_id: userId,
      course_id: update.courseId,
      progress_percentage: update.percentage,
      status: update.status,
      last_accessed_at: timestamp,
      updated_at: timestamp,
      ...(update.status === 'completed' && { completed_at: timestamp }),
      ...(update.status === 'in_progress' && update.percentage === 0 && { started_at: timestamp })
    }));

    const { error } = await supabase
      .from('user_course_progress')
      .upsert(upsertData, {
        onConflict: 'user_id,course_id'
      });

    if (error) throw error;
  }

  // Clear cache for course structure changes
  invalidateCourseCache(courseId?: string): void {
    if (courseId) {
      this.courseStructureCache.delete(courseId);
    } else {
      this.courseStructureCache.clear();
    }
  }

  // Get detailed progress analytics with single query
  async getDetailedProgressAnalytics(userId: string, courseId: string) {
    const [structureResult, progressResult, videoResult] = await Promise.all([
      this.getCourseStructures([courseId]),
      supabase
        .from('user_unit_progress')
        .select('unit_id, completed, completed_at, video_completed, quiz_completed')
        .eq('user_id', userId)
        .eq('course_id', courseId),
      supabase
        .from('user_video_progress')
        .select('unit_id, watch_percentage, is_completed')
        .eq('user_id', userId)
        .eq('course_id', courseId)
    ]);

    const structure = structureResult.get(courseId);
    const { data: unitProgress } = progressResult;
    const { data: videoProgress } = videoResult;

    if (!structure) {
      throw new Error(`Course structure not found for course: ${courseId}`);
    }

    // Process and combine all progress data
    const unitProgressMap = new Map(unitProgress?.map(up => [up.unit_id, up]) || []);
    const videoProgressMap = new Map(videoProgress?.map(vp => [vp.unit_id, vp]) || []);

    return {
      totalUnits: structure.totalUnits,
      completedUnits: unitProgress?.filter(up => up.completed).length || 0,
      videoCompletedUnits: unitProgress?.filter(up => up.video_completed).length || 0,
      quizCompletedUnits: unitProgress?.filter(up => up.quiz_completed).length || 0,
      averageVideoProgress: videoProgress?.reduce((sum, vp) => sum + vp.watch_percentage, 0) / (videoProgress?.length || 1) || 0,
      unitDetails: structure.lessonIds.map(lessonId => ({
        lessonId,
        unitProgress: unitProgressMap.get(lessonId),
        videoProgress: videoProgressMap.get(lessonId)
      }))
    };
  }
}

export const progressCalculationService = new ProgressCalculationService();