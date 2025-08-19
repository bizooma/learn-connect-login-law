import { useRef, useCallback, useEffect } from 'react';
import { logger } from '@/utils/logger';

interface VideoInstance {
  id: string;
  type: 'youtube' | 'upload';
  element: HTMLVideoElement | any;
  containerId?: string;
}

// PHASE 2: Video instance management to prevent multiple simultaneous videos
export const useVideoInstanceManager = () => {
  const activeInstancesRef = useRef<Map<string, VideoInstance>>(new Map());
  const maxActiveVideos = 1; // Limit to 1 active video at a time

  const registerVideoInstance = useCallback((
    id: string, 
    type: 'youtube' | 'upload', 
    element: HTMLVideoElement | any,
    containerId?: string
  ) => {
    // PHASE 2: Clean up existing instances if at limit
    if (activeInstancesRef.current.size >= maxActiveVideos) {
      const firstInstance = activeInstancesRef.current.values().next().value;
      if (firstInstance) {
        cleanupVideoInstance(firstInstance.id);
      }
    }

    const instance: VideoInstance = { id, type, element, containerId };
    activeInstancesRef.current.set(id, instance);
    
    logger.log('📹 Registered video instance:', { id, type, totalActive: activeInstancesRef.current.size });
  }, []);

  const cleanupVideoInstance = useCallback((id: string) => {
    const instance = activeInstancesRef.current.get(id);
    if (!instance) return;

    try {
      if (instance.type === 'youtube' && instance.element) {
        // PHASE 2: Force destroy YouTube player
        if (typeof instance.element.destroy === 'function') {
          instance.element.destroy();
        }
      } else if (instance.type === 'upload' && instance.element) {
        // PHASE 2: Cleanup HTML5 video
        instance.element.pause();
        instance.element.src = '';
        instance.element.load();
      }
    } catch (error) {
      logger.error('Error cleaning up video instance:', error);
    }

    activeInstancesRef.current.delete(id);
    logger.log('🧹 Cleaned up video instance:', { id, remainingActive: activeInstancesRef.current.size });
  }, []);

  const getActiveInstanceCount = useCallback(() => {
    return activeInstancesRef.current.size;
  }, []);

  const isAtVideoLimit = useCallback(() => {
    return activeInstancesRef.current.size >= maxActiveVideos;
  }, []);

  // PHASE 2: Cleanup all instances on unmount
  useEffect(() => {
    return () => {
      activeInstancesRef.current.forEach((instance) => {
        try {
          if (instance.type === 'youtube' && instance.element && typeof instance.element.destroy === 'function') {
            instance.element.destroy();
          } else if (instance.type === 'upload' && instance.element) {
            instance.element.pause();
            instance.element.src = '';
          }
        } catch (error) {
          logger.error('Error in cleanup during unmount:', error);
        }
      });
      activeInstancesRef.current.clear();
    };
  }, []);

  return {
    registerVideoInstance,
    cleanupVideoInstance,
    getActiveInstanceCount,
    isAtVideoLimit
  };
};