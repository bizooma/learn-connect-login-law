
// Legacy wrapper - now uses optimized centralized store
import { useProgressStore } from "../useProgressStore";

export const useUserProgress = (userId?: string) => {
  console.log('useUserProgress (legacy): Using optimized centralized store for user:', userId);
  return useProgressStore(userId);
};
