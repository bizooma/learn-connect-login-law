// DISABLED FOR EMERGENCY STABILITY
// This hook was causing video completion crashes
// Use useSimplifiedCompletion instead

import { logger } from "@/utils/logger";

export const useEnhancedVideoCompletion = (unitId: string, courseId: string) => {
  logger.warn('⚠️ useEnhancedVideoCompletion is disabled for stability. Use useSimplifiedCompletion instead.');
  
  return {
    completionState: {
      isCompleted: false,
      isProcessing: false,
      watchPercentage: 0,
      lastPosition: 0,
      completionAttempts: 0,
      lastError: null,
      canManualOverride: false
    },
    handleVideoProgress: () => {},
    handleVideoEnded: () => {},
    forceCompleteVideo: () => Promise.resolve(false),
    markVideoCompleteEnhanced: () => Promise.resolve(false),
    verifyCompletion: () => Promise.resolve(false)
  };
};