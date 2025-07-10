
// Legacy wrapper - now uses optimized centralized store
import { useAuth } from "@/hooks/useAuth";
import { useUnitProgressLegacy } from "./useProgressStore";

interface UnitProgressData {
  unit_id: string;
  completed: boolean;
  completed_at: string | null;
}

export const useUnitProgress = (courseId: string) => {
  const { user } = useAuth();
  console.log('useUnitProgress (legacy): Using optimized centralized store for course:', courseId);
  return useUnitProgressLegacy(courseId, user?.id);
};
