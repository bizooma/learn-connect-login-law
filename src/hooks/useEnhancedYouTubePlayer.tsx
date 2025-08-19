
import { useState, useEffect, useRef, useCallback } from 'react';
import { youTubeAPIService } from '@/services/youTubeAPIService';
import { useVideoPerformance } from './useVideoPerformance';

interface YouTubePlayerState {
  player: any | null;
  isReady: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playerState: number;
  error: string | null;
}

interface UseEnhancedYouTubePlayerProps {
  videoId: string;
  containerId: string;
  onStateChange?: (state: number) => void;
  onProgress?: (currentTime: number, duration: number) => void;
  onReady?: (player: any) => void;
  onError?: (error: string) => void;
}

export const useEnhancedYouTubePlayer = ({
  videoId,
  containerId,
  onStateChange,
  onProgress,
  onReady,
  onError
}: UseEnhancedYouTubePlayerProps) => {
  const [playerState, setPlayerState] = useState<YouTubePlayerState>({
    player: null,
    isReady: false,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    playerState: -1,
    error: null
  });

  const progressIntervalRef = useRef<number>();
  const playerRef = useRef<any>(null);
  const retryTimeoutRef = useRef<number>();

  const { startLoadTimer, endLoadTimer, recordError, recordRetry, updatePlayerState } = useVideoPerformance({
    videoId,
    onMetricsUpdate: (metrics) => {
      if (metrics.errorCount > 2) {
        console.warn('Multiple YouTube player errors detected for video:', videoId);
      }
    }
  });

  // Initialize player with enhanced error handling
  const initializePlayer = useCallback(async () => {
    if (!videoId || !containerId) return;

    try {
      startLoadTimer();
      updatePlayerState('initializing');

      // Wait for YouTube API to be ready
      await youTubeAPIService.loadAPI();

      if (!window.YT || !window.YT.Player) {
        throw new Error('YouTube API not available');
      }

      const player = new window.YT.Player(containerId, {
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          fs: 1,
          cc_load_policy: 0,
          iv_load_policy: 3,
          autohide: 0,
          enablejsapi: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event: any) => {
            console.log('Enhanced YouTube player ready for:', videoId);
            playerRef.current = event.target;
            
            endLoadTimer();
            updatePlayerState('ready');
            
            setPlayerState(prev => ({ 
              ...prev, 
              player: event.target, 
              isReady: true,
              duration: event.target.getDuration() || 0,
              error: null
            }));
            
            if (onReady) {
              onReady(event.target);
            }
          },
          onStateChange: (event: any) => {
            const state = event.data;
            console.log('Enhanced YouTube player state changed:', state, 'for video:', videoId);
            
            setPlayerState(prev => ({ 
              ...prev, 
              playerState: state,
              isPlaying: state === 1,
              duration: event.target.getDuration() || prev.duration
            }));

            updatePlayerState(getStateString(state));

            if (onStateChange) {
              onStateChange(state);
            }

            // Start/stop progress tracking based on state
            if (state === 1) { // Playing
              startProgressTracking();
            } else {
              stopProgressTracking();
            }

            // Handle video ended
            if (state === 0) { // Ended
              const duration = event.target.getDuration();
              if (onProgress && duration) {
                onProgress(duration, duration);
              }
            }
          },
          onError: (event: any) => {
            const errorCode = event.data;
            const errorMessage = getErrorMessage(errorCode);
            
            console.error('Enhanced YouTube player error:', errorCode, errorMessage, 'for video:', videoId);
            
            recordError();
            updatePlayerState('error');
            
            setPlayerState(prev => ({ 
              ...prev, 
              error: errorMessage,
              isReady: false,
              isPlaying: false
            }));

            if (onError) {
              onError(errorMessage);
            }

            // Attempt retry for recoverable errors
            if (isRecoverableError(errorCode)) {
              scheduleRetry();
            }
          }
        }
      });

      playerRef.current = player;
    } catch (error) {
      console.error('Error initializing enhanced YouTube player:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      
      recordError();
      updatePlayerState('error');
      
      setPlayerState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isReady: false 
      }));

      if (onError) {
        onError(errorMessage);
      }

      scheduleRetry();
    }
  }, [videoId, containerId, onReady, onStateChange, onError, startLoadTimer, endLoadTimer, recordError, updatePlayerState]);

  // Progress tracking with throttling
  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = window.setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          const duration = playerRef.current.getDuration();
          
          setPlayerState(prev => ({ 
            ...prev, 
            currentTime,
            duration: duration || prev.duration
          }));

          if (onProgress && duration > 0) {
            onProgress(currentTime, duration);
          }
        } catch (error) {
          console.warn('Error getting YouTube player time:', error);
        }
      }
    }, 10000); // PHASE 4: Further reduced frequency to 10 seconds for stability
  }, [onProgress]);

  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current !== undefined) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = undefined;
    }
  }, []);

  // Retry mechanism for failed loads with better cleanup
  const scheduleRetry = useCallback(() => {
    if (retryTimeoutRef.current !== undefined) {
      clearTimeout(retryTimeoutRef.current);
    }

    // PHASE 3: Exponential backoff retry with maximum attempts
    const retryCount = (retryTimeoutRef.current as any)?.retryCount || 0;
    if (retryCount >= 4) return; // Stop retrying after 4 attempts
    
    const retryDelay = Math.min(1000 * Math.pow(3, retryCount), 27000); // 1s, 3s, 9s, 27s max
    
    retryTimeoutRef.current = window.setTimeout(() => {
      recordRetry();
      updatePlayerState('retrying');
      (retryTimeoutRef.current as any).retryCount = retryCount + 1;
      initializePlayer();
    }, retryDelay);
  }, [initializePlayer, recordRetry, updatePlayerState]);

  // Initialize player when dependencies change
  useEffect(() => {
    if (videoId && containerId) {
      initializePlayer();
    }

    return () => {
      stopProgressTracking();
      
      // Clean up retry timeout
      if (retryTimeoutRef.current !== undefined) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = undefined;
      }
      
      // Clean up player
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
          playerRef.current = null;
        } catch (error) {
          console.warn('Error destroying YouTube player:', error);
        }
      }
    };
  }, [initializePlayer, videoId, containerId, stopProgressTracking]);

  // Player control methods with error handling
  const play = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      try {
        playerRef.current.playVideo();
      } catch (error) {
        console.warn('Error playing YouTube video:', error);
      }
    }
  }, []);

  const pause = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
      try {
        playerRef.current.pauseVideo();
      } catch (error) {
        console.warn('Error pausing YouTube video:', error);
      }
    }
  }, []);

  const seekTo = useCallback((seconds: number) => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      try {
        playerRef.current.seekTo(seconds, true);
      } catch (error) {
        console.warn('Error seeking YouTube video:', error);
      }
    }
  }, []);

  const retry = useCallback(() => {
    setPlayerState(prev => ({ ...prev, error: null }));
    initializePlayer();
  }, [initializePlayer]);

  return {
    ...playerState,
    play,
    pause,
    seekTo,
    retry,
    initializePlayer
  };
};

// Helper functions
function getStateString(state: number): string {
  const states: Record<number, string> = {
    '-1': 'unstarted',
    '0': 'ended',
    '1': 'playing',
    '2': 'paused',
    '3': 'buffering',
    '5': 'cued'
  };
  return states[state] || 'unknown';
}

function getErrorMessage(errorCode: number): string {
  const errorMessages: Record<number, string> = {
    2: 'Invalid video ID or video unavailable',
    5: 'HTML5 player error',
    100: 'Video not found or private',
    101: 'Video not allowed to be played in embedded players',
    150: 'Video not allowed to be played in embedded players'
  };
  return errorMessages[errorCode] || `YouTube player error (code: ${errorCode})`;
}

function isRecoverableError(errorCode: number): boolean {
  // Only retry for network-related errors, not content policy violations
  return errorCode === 5; // HTML5 player errors might be recoverable
}
