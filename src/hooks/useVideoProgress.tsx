
// Legacy wrapper - now uses optimized centralized store
import { useAuth } from "@/hooks/useAuth";
import { useVideoProgressLegacy } from "./useProgressStore";

interface VideoProgressData {
  watch_percentage: number;
  is_completed: boolean;
  completed_at: string | null;
  watched_duration_seconds: number;
  total_duration_seconds: number | null;
}

export const useVideoProgress = (unitId: string, courseId: string) => {
  const { user } = useAuth();
  console.log('useVideoProgress (legacy): Using optimized centralized store for unit:', unitId, 'course:', courseId);
  return useVideoProgressLegacy(courseId, unitId, user?.id);

};
