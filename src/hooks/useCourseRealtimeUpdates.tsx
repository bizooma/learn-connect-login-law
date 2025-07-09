import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useOptimizedRealtimeSubscriptions } from '@/hooks/useOptimizedRealtimeSubscriptions';
import { intervalManager } from '@/utils/intervalManager';

interface CourseRealtimeUpdateConfig {
  courseId: string;
  onCourseUpdate?: () => void;
  onContentUpdate?: () => void;
  enableSmartBatching?: boolean;
  batchDelay?: number;
}

interface UpdateBatch {
  types: Set<string>;
  lastUpdate: number;
  timeoutId?: number;
}

export const useCourseRealtimeUpdates = ({
  courseId,
  onCourseUpdate,
  onContentUpdate,
  enableSmartBatching = true,
  batchDelay = 500
}: CourseRealtimeUpdateConfig) => {
  const { subscribe, getStats } = useOptimizedRealtimeSubscriptions();
  const componentId = `course-realtime-${courseId}`;
  
  // Smart batching for coordinated updates
  const updateBatchRef = useRef<UpdateBatch>({
    types: new Set(),
    lastUpdate: 0
  });

  // Stable callback references
  const stableCourseUpdate = useCallback(() => {
    if (onCourseUpdate) {
      onCourseUpdate();
    }
  }, [onCourseUpdate]);

  const stableContentUpdate = useCallback(() => {
    if (onContentUpdate) {
      onContentUpdate();
    }
  }, [onContentUpdate]);

  // Intelligent update dispatcher with batching
  const dispatchUpdate = useCallback((updateType: string, callback?: () => void) => {
    if (!enableSmartBatching) {
      callback?.();
      return;
    }

    const batch = updateBatchRef.current;
    batch.types.add(updateType);
    batch.lastUpdate = Date.now();

    // Clear existing timeout
    if (batch.timeoutId) {
      clearTimeout(batch.timeoutId);
    }

    // Create new batched update
    batch.timeoutId = intervalManager.createTimeout(() => {
      const hasStructuralChanges = batch.types.has('modules') || batch.types.has('lessons');
      const hasContentChanges = batch.types.has('units') || batch.types.has('quizzes');

      console.log('📦 Processing batched updates:', {
        types: Array.from(batch.types),
        hasStructuralChanges,
        hasContentChanges,
        courseId
      });

      // Execute appropriate callbacks based on change types
      if (hasStructuralChanges) {
        stableCourseUpdate();
      }
      
      if (hasContentChanges) {
        stableContentUpdate();
      }

      // Reset batch
      batch.types.clear();
      batch.timeoutId = undefined;
    }, batchDelay, componentId);
  }, [enableSmartBatching, batchDelay, stableCourseUpdate, stableContentUpdate, componentId]);

  // Unified course content change handler
  const handleCourseContentChange = useCallback((payload: any, changeType: string) => {
    console.log(`📡 ${changeType} change detected:`, {
      eventType: payload.eventType,
      table: payload.table,
      courseId,
      recordId: payload.new?.id || payload.old?.id
    });

    // Determine if this change affects the current course
    const isRelevantChange = 
      changeType === 'modules' && payload.new?.course_id === courseId ||
      changeType === 'lessons' && payload.new?.course_id === courseId ||
      changeType === 'units' || // Units need special handling since they don't have direct course_id
      changeType === 'quizzes';

    if (isRelevantChange) {
      dispatchUpdate(changeType, changeType.includes('modules') || changeType.includes('lessons') 
        ? stableCourseUpdate 
        : stableContentUpdate
      );
    }
  }, [courseId, dispatchUpdate, stableCourseUpdate, stableContentUpdate]);

  // Create handlers for each content type
  const handleModulesChange = useCallback((payload: any) => 
    handleCourseContentChange(payload, 'modules'), [handleCourseContentChange]);
  
  const handleLessonsChange = useCallback((payload: any) => 
    handleCourseContentChange(payload, 'lessons'), [handleCourseContentChange]);
  
  const handleUnitsChange = useCallback((payload: any) => 
    handleCourseContentChange(payload, 'units'), [handleCourseContentChange]);

  // Memoized subscription configurations
  const subscriptionConfigs = useMemo(() => [
    {
      id: `course-modules-${courseId}`,
      table: 'modules',
      filter: `course_id=eq.${courseId}`,
      events: ['INSERT', 'UPDATE', 'DELETE'] as ('INSERT' | 'UPDATE' | 'DELETE')[],
      callback: handleModulesChange
    },
    {
      id: `course-lessons-${courseId}`,
      table: 'lessons',
      filter: `course_id=eq.${courseId}`,
      events: ['INSERT', 'UPDATE', 'DELETE'] as ('INSERT' | 'UPDATE' | 'DELETE')[],
      callback: handleLessonsChange
    },
    {
      id: `course-units-${courseId}`,
      table: 'units',
      events: ['INSERT', 'UPDATE', 'DELETE'] as ('INSERT' | 'UPDATE' | 'DELETE')[],
      callback: handleUnitsChange
    }
  ], [courseId, handleModulesChange, handleLessonsChange, handleUnitsChange]);

  // Set up coordinated subscriptions
  useEffect(() => {
    if (!courseId) return;

    console.log('🚀 Setting up unified course realtime subscriptions:', {
      courseId,
      batchingEnabled: enableSmartBatching,
      batchDelay
    });

    // Subscribe to all course-related changes
    const unsubscribeFunctions = subscriptionConfigs.map(config => 
      subscribe(config)
    );

    return () => {
      console.log('🧹 Cleaning up unified course subscriptions for:', courseId);
      
      // Clear any pending batch updates
      const batch = updateBatchRef.current;
      if (batch.timeoutId) {
        clearTimeout(batch.timeoutId);
        batch.timeoutId = undefined;
      }
      
      // Unsubscribe from all subscriptions
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [courseId, enableSmartBatching, batchDelay, subscribe, subscriptionConfigs]);

  // Subscription diagnostics
  const diagnostics = useMemo(() => ({
    courseId,
    subscriptionCount: subscriptionConfigs.length,
    batchingEnabled: enableSmartBatching,
    batchDelay,
    pendingUpdates: updateBatchRef.current.types.size,
    lastUpdate: updateBatchRef.current.lastUpdate,
    globalStats: getStats()
  }), [courseId, subscriptionConfigs.length, enableSmartBatching, batchDelay, getStats]);

  return {
    diagnostics,
    forceUpdate: () => {
      console.log('🔄 Force updating course content');
      stableCourseUpdate();
      stableContentUpdate();
    }
  };
};