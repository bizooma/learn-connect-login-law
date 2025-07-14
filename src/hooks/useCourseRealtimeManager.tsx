import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeManager } from './useRealtimeManager';

interface CourseRealtimeManagerOptions {
  courseId: string;
  onCourseStructureChange?: () => void;
  onQuizChange?: (unitId: string) => void;
  debounceMs?: number;
  enabled?: boolean; // Allow disabling realtime for certain pages
}

interface PendingUpdates {
  courseStructure: boolean;
  quizzes: Set<string>;
}

export const useCourseRealtimeManager = ({
  courseId,
  onCourseStructureChange,
  onQuizChange,
  debounceMs = 300,
  enabled = true
}: CourseRealtimeManagerOptions) => {
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<PendingUpdates>({
    courseStructure: false,
    quizzes: new Set()
  });

  const { createChannel, removeChannel, connectionStatus } = useRealtimeManager({
    enabled
  });

  const processPendingUpdates = useCallback(() => {
    const pending = pendingUpdatesRef.current;
    
    // Process course structure changes
    if (pending.courseStructure && onCourseStructureChange) {
      console.log('Processing course structure updates');
      onCourseStructureChange();
      pending.courseStructure = false;
    }

    // Process quiz changes
    if (pending.quizzes.size > 0 && onQuizChange) {
      pending.quizzes.forEach(unitId => {
        console.log('Processing quiz updates for unit:', unitId);
        onQuizChange(unitId);
      });
      pending.quizzes.clear();
    }
  }, [onCourseStructureChange, onQuizChange]);

  const scheduleUpdate = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      processPendingUpdates();
      debounceTimeoutRef.current = null;
    }, debounceMs);
  }, [processPendingUpdates, debounceMs]);

  const handleCourseStructureChange = useCallback((payload: any) => {
    console.log('Course structure change detected:', payload.table, payload.eventType);
    pendingUpdatesRef.current.courseStructure = true;
    scheduleUpdate();
  }, [scheduleUpdate]);

  const handleQuizChange = useCallback((payload: any) => {
    const unitId = payload.new?.unit_id || payload.old?.unit_id;
    if (unitId) {
      console.log('Quiz change detected for unit:', unitId);
      pendingUpdatesRef.current.quizzes.add(unitId);
      scheduleUpdate();
    }
  }, [scheduleUpdate]);

  const handleUnitChange = useCallback(async (payload: any) => {
    // For units, we need to check if they belong to our course
    const unitId = payload.new?.id || payload.old?.id;
    if (!unitId) return;

    try {
      // Check if this unit belongs to our course
      const { data: unit } = await supabase
        .from('units')
        .select('section_id, lessons!inner(course_id)')
        .eq('id', unitId)
        .single();

      if (unit?.lessons?.course_id === courseId) {
        console.log('Unit change detected for our course:', unitId);
        pendingUpdatesRef.current.courseStructure = true;
        scheduleUpdate();
      }
    } catch (error) {
      console.error('Error checking unit course relationship:', error);
      // Fallback: assume it might be relevant
      pendingUpdatesRef.current.courseStructure = true;
      scheduleUpdate();
    }
  }, [courseId, scheduleUpdate]);

  useEffect(() => {
    if (!courseId || !enabled) return;

    console.log('Setting up optimized real-time subscriptions for course:', courseId);

    // Create channel with all subscriptions
    const channelId = `course-${courseId}-realtime`;
    createChannel(channelId, [
      {
        event: '*',
        table: 'modules',
        filter: `course_id=eq.${courseId}`,
        callback: handleCourseStructureChange
      },
      {
        event: '*',
        table: 'lessons',
        filter: `course_id=eq.${courseId}`,
        callback: handleCourseStructureChange
      },
      {
        event: '*',
        table: 'units',
        callback: handleUnitChange
      },
      {
        event: '*',
        table: 'quizzes',
        callback: handleQuizChange
      }
    ]);

    return () => {
      console.log('Cleaning up optimized real-time subscriptions');
      
      // Clear any pending debounced updates
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
      
      // Reset pending updates
      pendingUpdatesRef.current = {
        courseStructure: false,
        quizzes: new Set()
      };
      
      // Remove channel
      const channelId = `course-${courseId}-realtime`;
      removeChannel(channelId);
    };
  }, [courseId, enabled, createChannel, removeChannel, handleCourseStructureChange, handleUnitChange, handleQuizChange]);

  // Return subscription status for debugging
  return {
    isConnected: connectionStatus.isConnected,
    channelState: connectionStatus.state,
    error: connectionStatus.error,
    enabled
  };
};