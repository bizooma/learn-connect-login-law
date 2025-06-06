
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { progressService } from "./progressService";

export const useUnitProgress = (
  userId?: string,
  pendingOperations?: Set<string>,
  setPendingOperations?: (fn: (prev: Set<string>) => Set<string>) => void,
  calculateCourseProgress?: (courseId: string) => Promise<void>
) => {
  const { toast } = useToast();

  const markUnitComplete = useCallback(async (unitId: string, courseId: string) => {
    if (!userId) {
      console.warn('Cannot mark unit complete: no user ID');
      return;
    }

    if (!pendingOperations || !setPendingOperations) {
      console.warn('Pending operations management not available');
      return;
    }

    const operationKey = `unit-${unitId}`;
    if (pendingOperations.has(operationKey)) {
      console.log('Unit complete operation already pending for unit:', unitId);
      return;
    }

    try {
      setPendingOperations(prev => new Set(prev).add(operationKey));
      await progressService.markUnitComplete(userId, unitId, courseId);
      if (calculateCourseProgress) {
        await calculateCourseProgress(courseId);
      }
    } catch (error) {
      console.error('Error marking unit complete:', error);
      if (error.code !== '23505') {
        toast({
          title: "Error",
          description: "Failed to mark unit as complete",
          variant: "destructive",
        });
      }
    } finally {
      setPendingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(operationKey);
        return newSet;
      });
    }
  }, [userId, calculateCourseProgress, toast, pendingOperations, setPendingOperations]);

  return {
    markUnitComplete
  };
};
