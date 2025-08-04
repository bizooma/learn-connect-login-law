
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";

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
      
      console.log(`Starting ${sessionType} session`, { courseId, userId: user.id, entryPoint: location.pathname });

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
        console.error('Error starting session:', error);
        return;
      }

      sessionIdRef.current = data;
      currentCourseIdRef.current = courseId || null;
      
      console.log(`${sessionType} session started:`, { sessionId: data, courseId, duration_tracking: 'enabled' });
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const endSession = async () => {
    if (!sessionIdRef.current) return;

    try {
      const sessionDuration = sessionStartTimeRef.current 
        ? Math.floor((new Date().getTime() - sessionStartTimeRef.current.getTime()) / 1000)
        : 0;

      console.log('Ending session:', { 
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
        console.error('Error ending session:', error);
        return;
      }

      console.log('Session ended successfully:', {
        previousSessionId: sessionIdRef.current,
        totalDuration: `${sessionDuration} seconds`
      });
      
      sessionIdRef.current = null;
      currentCourseIdRef.current = null;
      sessionStartTimeRef.current = null;
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const updateSessionForCourse = async (newCourseId: string | null) => {
    const previousCourseId = currentCourseIdRef.current;
    
    // If we're moving from one context to another, end current and start new
    if (previousCourseId !== newCourseId) {
      console.log('Course context changed:', { 
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
      console.log('User authenticated, initializing session tracking:', { 
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

  // Simplified cleanup on unmount (STABILITY FIX)
  useEffect(() => {
    return () => {
      // Quick cleanup without async operations that could hang
      sessionIdRef.current = null;
      currentCourseIdRef.current = null;
      sessionStartTimeRef.current = null;
    };
  }, []);

  // Simplified page unload handling (STABILITY FIX)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionIdRef.current) {
        // Simplified session cleanup - no complex beacon/fallback logic
        try {
          // Quick synchronous cleanup 
          sessionIdRef.current = null;
          currentCourseIdRef.current = null;
          sessionStartTimeRef.current = null;
        } catch (error) {
          // Silent cleanup - don't cause crashes during unload
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return {
    currentSessionId: sessionIdRef.current,
    currentCourseId: currentCourseIdRef.current,
    startSession,
    endSession
  };
};
