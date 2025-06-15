
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";

export const useSessionTracking = () => {
  const { user } = useAuth();
  const location = useLocation();
  const sessionIdRef = useRef<string | null>(null);
  const currentCourseIdRef = useRef<string | null>(null);

  // Extract course ID from current route
  const getCurrentCourseId = (): string | null => {
    const courseMatch = location.pathname.match(/\/course\/([^\/]+)/);
    return courseMatch ? courseMatch[1] : null;
  };

  const startSession = async (courseId?: string) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.rpc('start_user_session', {
        p_user_id: user.id,
        p_course_id: courseId || null,
        p_session_type: courseId ? 'course' : 'general',
        p_entry_point: location.pathname,
        p_ip_address: null, // Could be added later
        p_user_agent: navigator.userAgent,
        p_metadata: { 
          timestamp: new Date().toISOString(),
          referrer: document.referrer 
        }
      });

      if (error) {
        console.error('Error starting session:', error);
        return;
      }

      sessionIdRef.current = data;
      currentCourseIdRef.current = courseId || null;
      
      console.log('Session started:', data);
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const endSession = async () => {
    if (!sessionIdRef.current) return;

    try {
      const { error } = await supabase.rpc('end_user_session', {
        p_session_id: sessionIdRef.current,
        p_exit_point: location.pathname,
        p_metadata: { 
          timestamp: new Date().toISOString(),
          final_location: location.pathname 
        }
      });

      if (error) {
        console.error('Error ending session:', error);
        return;
      }

      console.log('Session ended:', sessionIdRef.current);
      sessionIdRef.current = null;
      currentCourseIdRef.current = null;
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const updateSessionForCourse = async (newCourseId: string | null) => {
    const previousCourseId = currentCourseIdRef.current;
    
    // If we're moving from one course to another, end current and start new
    if (previousCourseId !== newCourseId) {
      if (sessionIdRef.current) {
        await endSession();
      }
      if (newCourseId) {
        await startSession(newCourseId);
      } else {
        await startSession(); // Start general session
      }
    }
  };

  // Start session when user logs in
  useEffect(() => {
    if (user?.id && !sessionIdRef.current) {
      const courseId = getCurrentCourseId();
      startSession(courseId);
    }
  }, [user?.id]);

  // Track route changes and course transitions
  useEffect(() => {
    const currentCourseId = getCurrentCourseId();
    updateSessionForCourse(currentCourseId);
  }, [location.pathname]);

  // End session when component unmounts or user logs out
  useEffect(() => {
    return () => {
      if (sessionIdRef.current) {
        endSession();
      }
    };
  }, []);

  // End session when page unloads
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionIdRef.current) {
        // Use sendBeacon for reliability during page unload
        navigator.sendBeacon('/api/end-session', JSON.stringify({
          sessionId: sessionIdRef.current,
          exitPoint: location.pathname
        }));
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
