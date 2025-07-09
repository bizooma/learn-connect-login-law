import { useEffect, useCallback, useMemo } from 'react';
import { useOptimizedRealtimeSubscriptions } from '@/hooks/useOptimizedRealtimeSubscriptions';

interface UnitRealtimeUpdateConfig {
  unitId?: string;
  onQuizUpdate?: () => void;
  onProgressUpdate?: () => void;
  enableDynamicSubscription?: boolean;
}

export const useUnitRealtimeUpdates = ({
  unitId,
  onQuizUpdate,
  onProgressUpdate,
  enableDynamicSubscription = true
}: UnitRealtimeUpdateConfig) => {
  const { subscribe, getStats } = useOptimizedRealtimeSubscriptions();

  // Stable callback references
  const stableQuizUpdate = useCallback(() => {
    if (onQuizUpdate) {
      onQuizUpdate();
    }
  }, [onQuizUpdate]);

  const stableProgressUpdate = useCallback(() => {
    if (onProgressUpdate) {
      onProgressUpdate();
    }
  }, [onProgressUpdate]);

  // Quiz change handler with intelligent filtering
  const handleQuizChange = useCallback((payload: any) => {
    console.log('📊 Quiz change detected:', {
      eventType: payload.eventType,
      unitId: payload.new?.unit_id || payload.old?.unit_id,
      targetUnit: unitId,
      isRelevant: (payload.new?.unit_id === unitId) || (payload.old?.unit_id === unitId)
    });

    // Only process if this change affects the current unit
    if ((payload.new?.unit_id === unitId) || (payload.old?.unit_id === unitId)) {
      stableQuizUpdate();
    }
  }, [unitId, stableQuizUpdate]);

  // Progress change handler
  const handleProgressChange = useCallback((payload: any) => {
    console.log('📈 Progress change detected:', {
      eventType: payload.eventType,
      unitId: payload.new?.unit_id || payload.old?.unit_id,
      targetUnit: unitId
    });

    if ((payload.new?.unit_id === unitId) || (payload.old?.unit_id === unitId)) {
      stableProgressUpdate();
    }
  }, [unitId, stableProgressUpdate]);

  // Memoized subscription configurations - only create when unitId exists
  const subscriptionConfigs = useMemo(() => {
    if (!unitId || !enableDynamicSubscription) return [];

    return [
      {
        id: `unit-quiz-${unitId}`,
        table: 'quizzes',
        filter: `unit_id=eq.${unitId}`,
        events: ['INSERT', 'UPDATE', 'DELETE'] as ('INSERT' | 'UPDATE' | 'DELETE')[],
        callback: handleQuizChange
      },
      {
        id: `unit-progress-${unitId}`,
        table: 'user_unit_progress',
        filter: `unit_id=eq.${unitId}`,
        events: ['INSERT', 'UPDATE'] as ('INSERT' | 'UPDATE')[],
        callback: handleProgressChange
      }
    ];
  }, [unitId, enableDynamicSubscription, handleQuizChange, handleProgressChange]);

  // Set up unit-specific subscriptions
  useEffect(() => {
    if (!unitId || !enableDynamicSubscription || subscriptionConfigs.length === 0) {
      return;
    }

    console.log('🎯 Setting up unit-specific realtime subscriptions:', {
      unitId,
      subscriptionCount: subscriptionConfigs.length
    });

    // Subscribe to unit-related changes
    const unsubscribeFunctions = subscriptionConfigs.map(config => 
      subscribe(config)
    );

    return () => {
      console.log('🧹 Cleaning up unit subscriptions for:', unitId);
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [unitId, enableDynamicSubscription, subscribe, subscriptionConfigs]);

  // Unit diagnostics
  const diagnostics = useMemo(() => ({
    unitId,
    subscriptionCount: subscriptionConfigs.length,
    dynamicSubscriptionEnabled: enableDynamicSubscription,
    globalStats: getStats()
  }), [unitId, subscriptionConfigs.length, enableDynamicSubscription, getStats]);

  return {
    diagnostics,
    forceQuizUpdate: stableQuizUpdate,
    forceProgressUpdate: stableProgressUpdate
  };
};