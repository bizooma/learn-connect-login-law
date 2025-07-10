import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface CourseRealtimeManagerOptions {
  courseId: string;
  onCourseStructureChange?: () => void;
  onQuizChange?: (unitId: string) => void;
  debounceMs?: number;
}

interface PendingUpdates {
  courseStructure: boolean;
  quizzes: Set<string>;
}

export const useCourseRealtimeManager = ({
  courseId,
  onCourseStructureChange,
  onQuizChange,
  debounceMs = 300
}: CourseRealtimeManagerOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<PendingUpdates>({
    courseStructure: false,
    quizzes: new Set()
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
    if (!courseId) return;

    console.log('Setting up centralized real-time subscriptions for course:', courseId);

    // Create single channel for all course-related changes
    const channel = supabase
      .channel(`course-${courseId}-realtime`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'modules',
          filter: `course_id=eq.${courseId}`
        },
        handleCourseStructureChange
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lessons',
          filter: `course_id=eq.${courseId}`
        },
        handleCourseStructureChange
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'units'
        },
        handleUnitChange
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quizzes'
        },
        handleQuizChange
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      console.log('Cleaning up centralized real-time subscriptions');
      
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
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [courseId, handleCourseStructureChange, handleUnitChange, handleQuizChange]);

  // Return subscription status for debugging
  return {
    isConnected: channelRef.current?.state === 'joined',
    channelState: channelRef.current?.state
  };
};