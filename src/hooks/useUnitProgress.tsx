
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/utils/logger";

interface UnitProgressData {
  unit_id: string;
  completed: boolean;
  completed_at: string | null;
}

export const useUnitProgress = (courseId: string) => {
  const { user } = useAuth();
  const [unitProgress, setUnitProgress] = useState<Record<string, UnitProgressData>>({});
  const [loading, setLoading] = useState(true);

  const fetchUnitProgress = useCallback(async () => {
    if (!user || !courseId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_unit_progress')
        .select('unit_id, completed, completed_at')
        .eq('user_id', user.id)
        .eq('course_id', courseId);

      if (error) {
        logger.error('Error fetching unit progress:', error);
        return;
      }

      // Remove any duplicate entries by unit_id
      const uniqueProgress = data ? data.filter((item, index, self) => 
        index === self.findIndex(p => p.unit_id === item.unit_id)
      ) : [];

      const progressMap = uniqueProgress.reduce((acc, item) => {
        acc[item.unit_id] = item;
        return acc;
      }, {} as Record<string, UnitProgressData>);

      setUnitProgress(progressMap);
    } catch (error) {
      logger.error('Error fetching unit progress:', error);
    } finally {
      setLoading(false);
    }
  }, [user, courseId]);

  const markUnitComplete = useCallback((unitId: string) => {
    setUnitProgress(prev => ({
      ...prev,
      [unitId]: {
        unit_id: unitId,
        completed: true,
        completed_at: new Date().toISOString()
      }
    }));
  }, []);

  const isUnitCompleted = useCallback((unitId: string) => {
    return unitProgress[unitId]?.completed || false;
  }, [unitProgress]);

  const getUnitCompletedAt = useCallback((unitId: string) => {
    return unitProgress[unitId]?.completed_at || null;
  }, [unitProgress]);

  useEffect(() => {
    fetchUnitProgress();
  }, [fetchUnitProgress]);

  return {
    unitProgress,
    loading,
    isUnitCompleted,
    getUnitCompletedAt,
    markUnitComplete,
    fetchUnitProgress
  };
};
