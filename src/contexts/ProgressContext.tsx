import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { optimizationTracker } from '@/utils/algorithmicOptimizationTracker';

// Types
interface CourseProgress {
  course_id: string;
  user_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage: number;
  completed_at?: string;
  last_accessed_at?: string;
}

interface UnitProgress {
  unit_id: string;
  course_id: string;
  user_id: string;
  completed: boolean;
  completed_at?: string;
}

interface TeamProgress {
  team_id: string;
  members: Array<{
    user_id: string;
    email: string;
    name: string;
    total_courses: number;
    completed_courses: number;
    overall_progress: number;
  }>;
}

interface ProgressCache {
  courseProgress: Map<string, CourseProgress[]>; // key: userId
  unitProgress: Map<string, UnitProgress[]>; // key: `userId-courseId`
  teamProgress: Map<string, TeamProgress>; // key: teamId
  calculations: Map<string, any>; // key: calculation identifier
  lastUpdated: Map<string, number>; // key: cache key, value: timestamp
}

interface ProgressState {
  cache: ProgressCache;
  loading: Set<string>;
  errors: Map<string, string>;
}

// Actions
type ProgressAction =
  | { type: 'SET_LOADING'; key: string; loading: boolean }
  | { type: 'SET_ERROR'; key: string; error?: string }
  | { type: 'SET_COURSE_PROGRESS'; userId: string; data: CourseProgress[] }
  | { type: 'SET_UNIT_PROGRESS'; userId: string; courseId: string; data: UnitProgress[] }
  | { type: 'SET_TEAM_PROGRESS'; teamId: string; data: TeamProgress }
  | { type: 'SET_CALCULATION'; key: string; data: any }
  | { type: 'INVALIDATE_CACHE'; pattern?: string };

// Initial state
const initialState: ProgressState = {
  cache: {
    courseProgress: new Map(),
    unitProgress: new Map(),
    teamProgress: new Map(),
    calculations: new Map(),
    lastUpdated: new Map()
  },
  loading: new Set(),
  errors: new Map()
};

// Reducer
function progressReducer(state: ProgressState, action: ProgressAction): ProgressState {
  switch (action.type) {
    case 'SET_LOADING': {
      const loading = new Set(state.loading);
      if (action.loading) {
        loading.add(action.key);
      } else {
        loading.delete(action.key);
      }
      return { ...state, loading };
    }

    case 'SET_ERROR': {
      const errors = new Map(state.errors);
      if (action.error) {
        errors.set(action.key, action.error);
      } else {
        errors.delete(action.key);
      }
      return { ...state, errors };
    }

    case 'SET_COURSE_PROGRESS': {
      const cache = { ...state.cache };
      cache.courseProgress.set(action.userId, action.data);
      cache.lastUpdated.set(`course-${action.userId}`, Date.now());
      return { ...state, cache };
    }

    case 'SET_UNIT_PROGRESS': {
      const cache = { ...state.cache };
      const key = `${action.userId}-${action.courseId}`;
      cache.unitProgress.set(key, action.data);
      cache.lastUpdated.set(`unit-${key}`, Date.now());
      return { ...state, cache };
    }

    case 'SET_TEAM_PROGRESS': {
      const cache = { ...state.cache };
      cache.teamProgress.set(action.teamId, action.data);
      cache.lastUpdated.set(`team-${action.teamId}`, Date.now());
      return { ...state, cache };
    }

    case 'SET_CALCULATION': {
      const cache = { ...state.cache };
      cache.calculations.set(action.key, action.data);
      cache.lastUpdated.set(`calc-${action.key}`, Date.now());
      return { ...state, cache };
    }

    case 'INVALIDATE_CACHE': {
      const cache = { ...state.cache };
      if (action.pattern) {
        // Invalidate specific patterns
        for (const key of cache.lastUpdated.keys()) {
          if (key.includes(action.pattern)) {
            cache.lastUpdated.delete(key);
          }
        }
      } else {
        // Clear all cache
        cache.courseProgress.clear();
        cache.unitProgress.clear();
        cache.teamProgress.clear();
        cache.calculations.clear();
        cache.lastUpdated.clear();
      }
      return { ...state, cache };
    }

    default:
      return state;
  }
}

// Context
interface ProgressContextType {
  // State access
  getCourseProgress: (userId: string) => CourseProgress[] | null;
  getUnitProgress: (userId: string, courseId: string) => UnitProgress[] | null;
  getTeamProgress: (teamId: string) => TeamProgress | null;
  getCalculation: (key: string) => any;
  isLoading: (key: string) => boolean;
  getError: (key: string) => string | null;

  // Actions
  fetchCourseProgress: (userId: string, force?: boolean) => Promise<void>;
  fetchUnitProgress: (userId: string, courseId: string, force?: boolean) => Promise<void>;
  fetchTeamProgress: (teamId: string, force?: boolean) => Promise<void>;
  calculateCourseProgress: (userId: string, courseId: string) => Promise<{ progress: number; status: string }>;
  updateUnitProgress: (userId: string, unitId: string, courseId: string, completed: boolean) => Promise<void>;
  invalidateCache: (pattern?: string) => void;

  // Batch operations
  batchFetchCourseProgress: (userIds: string[]) => Promise<void>;
  batchCalculateProgress: (requests: Array<{ userId: string; courseId: string }>) => Promise<void>;
}

const ProgressContext = createContext<ProgressContextType | null>(null);

// Provider component
export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(progressReducer, initialState);
  const { user } = useAuth();
  
  // Cache TTL in milliseconds (5 minutes)
  const CACHE_TTL = 5 * 60 * 1000;

  // Helper to check if cache is valid
  const isCacheValid = useCallback((key: string): boolean => {
    const lastUpdated = state.cache.lastUpdated.get(key);
    return lastUpdated ? (Date.now() - lastUpdated) < CACHE_TTL : false;
  }, [state.cache.lastUpdated]);

  // Enhanced course progress operations with intelligent caching
  const fetchCourseProgress = useCallback(async (userId: string, force = false) => {
    const cacheKey = `course-${userId}`;
    
    if (!force && isCacheValid(cacheKey)) {
      optimizationTracker.trackOptimization(
        `ProgressCacheHit_${userId}`,
        'memory_optimization',
        0,
        0,
        1
      );
      return; // Use cached data
    }

    dispatch({ type: 'SET_LOADING', key: cacheKey, loading: true });
    dispatch({ type: 'SET_ERROR', key: cacheKey });

    try {
      const startTime = performance.now();
      
      // Enhanced query with unit progress data for immediate availability
      const { data, error } = await supabase
        .from('user_course_progress')
        .select(`
          course_id,
          user_id,
          status,
          progress_percentage,
          completed_at,
          last_accessed_at,
          started_at,
          courses!inner(
            id, 
            title, 
            category,
            lessons!inner(
              id,
              units!inner(
                id,
                user_unit_progress!left(
                  completed,
                  completed_at,
                  video_completed,
                  quiz_completed
                )
              )
            )
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const courseProgress: CourseProgress[] = (data || []).map(item => ({
        course_id: item.course_id,
        user_id: item.user_id,
        status: item.status as any,
        progress_percentage: item.progress_percentage,
        completed_at: item.completed_at,
        last_accessed_at: item.last_accessed_at
      }));

      // Pre-populate unit progress cache from the same query
      data?.forEach(courseData => {
        const unitProgress: UnitProgress[] = [];
        courseData.courses?.lessons?.forEach(lesson => {
          lesson.units?.forEach(unit => {
            const progress = unit.user_unit_progress?.[0];
            unitProgress.push({
              unit_id: unit.id,
              course_id: courseData.course_id,
              user_id: userId,
              completed: progress?.completed || false,
              completed_at: progress?.completed_at || undefined
            });
          });
        });
        
        if (unitProgress.length > 0) {
          dispatch({ 
            type: 'SET_UNIT_PROGRESS', 
            userId, 
            courseId: courseData.course_id, 
            data: unitProgress 
          });
        }
      });

      dispatch({ type: 'SET_COURSE_PROGRESS', userId, data: courseProgress });

      const endTime = performance.now();
      optimizationTracker.trackOptimization(
        `OptimizedProgressFetch_${userId}`,
        'parallel_processing',
        endTime - startTime,
        endTime,
        courseProgress.length
      );

    } catch (error: any) {
      console.error('Error fetching course progress:', error);
      dispatch({ type: 'SET_ERROR', key: cacheKey, error: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', key: cacheKey, loading: false });
    }
  }, [isCacheValid]);

  // Unit progress operations
  const fetchUnitProgress = useCallback(async (userId: string, courseId: string, force = false) => {
    const cacheKey = `unit-${userId}-${courseId}`;
    
    if (!force && isCacheValid(cacheKey)) {
      return; // Use cached data
    }

    dispatch({ type: 'SET_LOADING', key: cacheKey, loading: true });
    dispatch({ type: 'SET_ERROR', key: cacheKey });

    try {
      const { data, error } = await supabase
        .from('user_unit_progress')
        .select('unit_id, course_id, user_id, completed, completed_at')
        .eq('user_id', userId)
        .eq('course_id', courseId);

      if (error) throw error;

      const unitProgress: UnitProgress[] = (data || []).map(item => ({
        unit_id: item.unit_id,
        course_id: item.course_id,
        user_id: item.user_id,
        completed: item.completed,
        completed_at: item.completed_at
      }));

      dispatch({ type: 'SET_UNIT_PROGRESS', userId, courseId, data: unitProgress });
    } catch (error: any) {
      console.error('Error fetching unit progress:', error);
      dispatch({ type: 'SET_ERROR', key: cacheKey, error: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', key: cacheKey, loading: false });
    }
  }, [isCacheValid]);

  // Team progress operations
  const fetchTeamProgress = useCallback(async (teamId: string, force = false) => {
    const cacheKey = `team-${teamId}`;
    
    if (!force && isCacheValid(cacheKey)) {
      return; // Use cached data
    }

    dispatch({ type: 'SET_LOADING', key: cacheKey, loading: true });
    dispatch({ type: 'SET_ERROR', key: cacheKey });

    try {
      // Get team members - fix the relation query
      const { data: teamMembers, error: membersError } = await supabase
        .from('admin_team_members')
        .select('user_id')
        .eq('team_id', teamId);

      if (membersError) throw membersError;

      if (!teamMembers?.length) {
        dispatch({ type: 'SET_TEAM_PROGRESS', teamId, data: { team_id: teamId, members: [] } });
        return;
      }

      // Get profiles for team members
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', teamMembers.map(m => m.user_id));

      if (profilesError) throw profilesError;

      const userIds = teamMembers.map(m => m.user_id);

      // Get course progress for all team members in one query
      const { data: progressData, error: progressError } = await supabase
        .from('user_course_progress')
        .select('user_id, status, progress_percentage')
        .in('user_id', userIds);

      if (progressError) throw progressError;

      // Calculate team progress
      const teamProgress: TeamProgress = {
        team_id: teamId,
        members: teamMembers.map(member => {
          const profile = profiles?.find(p => p.id === member.user_id);
          const userProgress = progressData?.filter(p => p.user_id === member.user_id) || [];
          const totalCourses = userProgress.length;
          const completedCourses = userProgress.filter(p => p.status === 'completed').length;
          const overallProgress = totalCourses > 0 
            ? Math.round(userProgress.reduce((sum, p) => sum + p.progress_percentage, 0) / totalCourses)
            : 0;

          return {
            user_id: member.user_id,
            email: profile?.email || '',
            name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
            total_courses: totalCourses,
            completed_courses: completedCourses,
            overall_progress: overallProgress
          };
        })
      };

      dispatch({ type: 'SET_TEAM_PROGRESS', teamId, data: teamProgress });
    } catch (error: any) {
      console.error('Error fetching team progress:', error);
      dispatch({ type: 'SET_ERROR', key: cacheKey, error: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', key: cacheKey, loading: false });
    }
  }, [isCacheValid]);

  // Optimized progress calculation with single unified query
  const calculateCourseProgress = useCallback(async (userId: string, courseId: string) => {
    const calcKey = `calc-${userId}-${courseId}`;
    
    if (isCacheValid(calcKey)) {
      return state.cache.calculations.get(calcKey);
    }

    try {
      optimizationTracker.trackOptimization(
        `OptimizedProgressCalc_${courseId}`,
        'parallel_processing',
        0,
        performance.now(),
        1
      );

      // Single comprehensive query instead of 3 separate queries
      const { data: courseData, error } = await supabase
        .from('lessons')
        .select(`
          id,
          units!inner(
            id,
            user_unit_progress!left(
              completed,
              user_id
            )
          )
        `)
        .eq('course_id', courseId);

      if (error) throw error;

      // Calculate progress from the unified result
      const allUnits = courseData?.flatMap(lesson => lesson.units || []) || [];
      const totalUnits = allUnits.length;
      const completedUnits = allUnits.filter(unit => 
        unit.user_unit_progress?.some(progress => 
          progress.completed && progress.user_id === userId
        )
      ).length;
      
      const progress = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;
      const status = progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started';

      const result = { progress, status, totalUnits, completedUnits };
      dispatch({ type: 'SET_CALCULATION', key: calcKey, data: result });
      
      return result;
    } catch (error) {
      console.error('Error calculating course progress:', error);
      throw error;
    }
  }, [isCacheValid]);

  // Batch operations for efficiency
  const batchFetchCourseProgress = useCallback(async (userIds: string[]) => {
    const fetchPromises = userIds.map(userId => fetchCourseProgress(userId));
    await Promise.allSettled(fetchPromises);
  }, [fetchCourseProgress]);

  const batchCalculateProgress = useCallback(async (requests: Array<{ userId: string; courseId: string }>) => {
    const calcPromises = requests.map(req => calculateCourseProgress(req.userId, req.courseId));
    await Promise.allSettled(calcPromises);
  }, [calculateCourseProgress]);

  // Update unit progress
  const updateUnitProgress = useCallback(async (userId: string, unitId: string, courseId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('user_unit_progress')
        .upsert({
          user_id: userId,
          unit_id: unitId,
          course_id: courseId,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Invalidate related caches
      dispatch({ type: 'INVALIDATE_CACHE', pattern: `unit-${userId}-${courseId}` });
      dispatch({ type: 'INVALIDATE_CACHE', pattern: `calc-${userId}-${courseId}` });
      
      // Refresh unit progress
      await fetchUnitProgress(userId, courseId, true);
    } catch (error) {
      console.error('Error updating unit progress:', error);
      throw error;
    }
  }, [fetchUnitProgress]);

  // Cache invalidation
  const invalidateCache = useCallback((pattern?: string) => {
    dispatch({ type: 'INVALIDATE_CACHE', pattern });
  }, []);

  // Context value
  const contextValue: ProgressContextType = {
    // State access
    getCourseProgress: (userId: string) => state.cache.courseProgress.get(userId) || null,
    getUnitProgress: (userId: string, courseId: string) => state.cache.unitProgress.get(`${userId}-${courseId}`) || null,
    getTeamProgress: (teamId: string) => state.cache.teamProgress.get(teamId) || null,
    getCalculation: (key: string) => state.cache.calculations.get(key),
    isLoading: (key: string) => state.loading.has(key),
    getError: (key: string) => state.errors.get(key) || null,

    // Actions
    fetchCourseProgress,
    fetchUnitProgress,
    fetchTeamProgress,
    calculateCourseProgress,
    updateUnitProgress,
    invalidateCache,

    // Batch operations
    batchFetchCourseProgress,
    batchCalculateProgress
  };

  return (
    <ProgressContext.Provider value={contextValue}>
      {children}
    </ProgressContext.Provider>
  );
};

// Hook to use progress context
export const useProgressContext = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgressContext must be used within a ProgressProvider');
  }
  return context;
};