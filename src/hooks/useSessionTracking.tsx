
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import { logger } from "@/utils/logger";

export const useSessionTracking = () => {
  const { user } = useAuth();
  const location = useLocation();
  const sessionIdRef = useRef<string | null>(null);
  const currentCourseIdRef = useRef<string | null>(null);
  const sessionStartTimeRef = useRef<Date | null>(null);

  // Extract course ID from current route
  const getCurrentCourseId = (): string | null => {
    const courseMatch = location.pathname.match(/\/course\/([^\/]+)/);
    return courseMatch ? courseMatch[1] : null;
  };

  const startSession = async (courseId?: string) => {
    if (!user?.id) return;

    // End any existing session first
    if (sessionIdRef.current) {
      await endSession();
    }

    try {
      const sessionType = courseId ? 'course' : 'general';
      sessionStartTimeRef.current = new Date();
      
      logger.log(`Starting ${sessionType} session`, { courseId, userId: user.id, entryPoint: location.pathname });

      const { data, error } = await supabase.rpc('start_user_session', {
        p_user_id: user.id,
        p_course_id: courseId || null,
        p_session_type: sessionType,
        p_entry_point: location.pathname,
        p_ip_address: null,
        p_user_agent: navigator.userAgent,
        p_metadata: { 
          timestamp: new Date().toISOString(),
          referrer: document.referrer,
          course_accessed: !!courseId
        }
      });

      if (error) {
        logger.error('Error starting session:', error);
        return;
      }

      sessionIdRef.current = data;
      currentCourseIdRef.current = courseId || null;
      
      logger.log(`${sessionType} session started:`, { sessionId: data, courseId, duration_tracking: 'enabled' });
    } catch (error) {
      logger.error('Error starting session:', error);
    }
  };

  const endSession = async () => {
    if (!sessionIdRef.current) return;

    try {
      const sessionDuration = sessionStartTimeRef.current 
        ? Math.floor((new Date().getTime() - sessionStartTimeRef.current.getTime()) / 1000)
        : 0;

      logger.log('Ending session:', { 
        sessionId: sessionIdRef.current, 
        courseId: currentCourseIdRef.current,
        duration: `${sessionDuration} seconds`,
        exitPoint: location.pathname
      });

      const { error } = await supabase.rpc('end_user_session', {
        p_session_id: sessionIdRef.current,
        p_exit_point: location.pathname,
        p_metadata: { 
          timestamp: new Date().toISOString(),
          final_location: location.pathname,
          session_duration_seconds: sessionDuration,
          course_accessed: !!currentCourseIdRef.current
        }
      });

      if (error) {
        logger.error('Error ending session:', error);
        return;
      }

      logger.log('Session ended successfully:', {
        previousSessionId: sessionIdRef.current,
        totalDuration: `${sessionDuration} seconds`
      });
      
      sessionIdRef.current = null;
      currentCourseIdRef.current = null;
      sessionStartTimeRef.current = null;
    } catch (error) {
      logger.error('Error ending session:', error);
    }
  };

  const updateSessionForCourse = async (newCourseId: string | null) => {
    const previousCourseId = currentCourseIdRef.current;
    
    // If we're moving from one context to another, end current and start new
    if (previousCourseId !== newCourseId) {
      logger.log('Course context changed:', { 
        from: previousCourseId || 'general', 
        to: newCourseId || 'general' 
      });
      
      if (sessionIdRef.current) {
        await endSession();
      }
      
      // Start new session with appropriate context
      await startSession(newCourseId || undefined);
    }
  };

  // Start session when user logs in
  useEffect(() => {
    if (user?.id && !sessionIdRef.current) {
      const courseId = getCurrentCourseId();
      logger.log('User authenticated, initializing session tracking:', { 
        userId: user.id, 
        courseId: courseId || 'none',
        route: location.pathname 
      });
      startSession(courseId);
    }
  }, [user?.id]);

  // Track route changes and course transitions
  useEffect(() => {
    if (user?.id) {
      const currentCourseId = getCurrentCourseId();
      updateSessionForCourse(currentCourseId);
    }
  }, [location.pathname, user?.id]);

  // End session when component unmounts or user logs out
  useEffect(() => {
    return () => {
      if (sessionIdRef.current) {
        logger.log('Component unmounting, ending session');
        endSession();
      }
    };
  }, []);

  // End session when page unloads
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (sessionIdRef.current) {
        logger.log('Page unloading, attempting to end session');
        // Use sendBeacon for better reliability during page unload
        const sessionData = {
          sessionId: sessionIdRef.current,
          exitPoint: location.pathname,
          timestamp: new Date().toISOString()
        };
        
        // Attempt to send the session end via beacon
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/end-session', JSON.stringify(sessionData));
        }
        
        // Also try the normal way as fallback
        endSession();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [location.pathname]);

  return {
    currentSessionId: sessionIdRef.current,
    currentCourseId: currentCourseIdRef.current,
    startSession,
    endSession
  };
};
