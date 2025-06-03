
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type ActivityType = 
  | 'login'
  | 'logout'
  | 'course_access'
  | 'unit_access'
  | 'unit_complete'
  | 'quiz_start'
  | 'quiz_complete'
  | 'video_play'
  | 'video_pause'
  | 'video_complete'
  | 'page_view';

interface ActivityData {
  activityType: ActivityType;
  courseId?: string;
  unitId?: string;
  quizId?: string;
  sessionId?: string;
  durationSeconds?: number;
  metadata?: Record<string, any>;
}

export const useActivityTracking = () => {
  const { user } = useAuth();

  const logActivity = useCallback(async (data: ActivityData) => {
    if (!user) return;

    try {
      // Generate session ID if not provided
      const sessionId = data.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Get basic browser info
      const userAgent = navigator.userAgent;
      
      const { error } = await supabase.rpc('log_user_activity', {
        p_user_id: user.id,
        p_activity_type: data.activityType,
        p_course_id: data.courseId || null,
        p_unit_id: data.unitId || null,
        p_quiz_id: data.quizId || null,
        p_session_id: sessionId,
        p_duration_seconds: data.durationSeconds || null,
        p_metadata: data.metadata || {},
        p_user_agent: userAgent
      });

      if (error) {
        console.error('Error logging activity:', error);
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }, [user]);

  const logCourseAccess = useCallback((courseId: string) => {
    logActivity({ activityType: 'course_access', courseId });
  }, [logActivity]);

  const logUnitAccess = useCallback((unitId: string, courseId: string) => {
    logActivity({ activityType: 'unit_access', unitId, courseId });
  }, [logActivity]);

  const logUnitComplete = useCallback((unitId: string, courseId: string, durationSeconds?: number) => {
    logActivity({ 
      activityType: 'unit_complete', 
      unitId, 
      courseId,
      durationSeconds 
    });
  }, [logActivity]);

  const logQuizStart = useCallback((quizId: string, courseId?: string) => {
    logActivity({ activityType: 'quiz_start', quizId, courseId });
  }, [logActivity]);

  const logQuizComplete = useCallback((quizId: string, courseId?: string, score?: number) => {
    logActivity({ 
      activityType: 'quiz_complete', 
      quizId, 
      courseId,
      metadata: score !== undefined ? { score } : undefined
    });
  }, [logActivity]);

  const logVideoInteraction = useCallback((
    action: 'play' | 'pause' | 'complete',
    unitId: string,
    courseId: string,
    durationSeconds?: number
  ) => {
    const activityType = action === 'play' ? 'video_play' 
                      : action === 'pause' ? 'video_pause' 
                      : 'video_complete';
    
    logActivity({ 
      activityType, 
      unitId, 
      courseId,
      durationSeconds 
    });
  }, [logActivity]);

  const logPageView = useCallback((metadata?: Record<string, any>) => {
    logActivity({ activityType: 'page_view', metadata });
  }, [logActivity]);

  return {
    logActivity,
    logCourseAccess,
    logUnitAccess,
    logUnitComplete,
    logQuizStart,
    logQuizComplete,
    logVideoInteraction,
    logPageView
  };
};
