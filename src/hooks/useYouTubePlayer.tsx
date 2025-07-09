
import { useState, useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerState {
  player: any | null;
  isReady: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playerState: number;
}

interface UseYouTubePlayerProps {
  videoId: string;
  containerId: string;
  onStateChange?: (state: number) => void;
  onProgress?: (currentTime: number, duration: number) => void;
  onReady?: (player: any) => void;
}

export const useYouTubePlayer = ({
  videoId,
  containerId,
  onStateChange,
  onProgress,
  onReady
}: UseYouTubePlayerProps) => {
  const [playerState, setPlayerState] = useState<YouTubePlayerState>({
    player: null,
    isReady: false,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    playerState: -1
  });

  const progressIntervalRef = useRef<number>();
  const playerRef = useRef<any>(null);
  const cleanupTimeoutRef = useRef<number>();
  const lastProgressUpdateRef = useRef<number>(0);

  // Load YouTube API
  useEffect(() => {
    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
          const script = document.createElement('script');
          script.src = 'https://www.youtube.com/iframe_api';
          document.head.appendChild(script);
        }

        window.onYouTubeIframeAPIReady = () => {
          resolve();
        };

        // Fallback in case the API is already loaded
        const checkAPI = () => {
          if (window.YT && window.YT.Player) {
            resolve();
          } else {
            setTimeout(checkAPI, 100);
          }
        };
        checkAPI();
      });
    };

    loadYouTubeAPI();
  }, []);

  // Stop progress tracking function
  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = undefined;
    }
  }, []);

  // Optimized progress tracking with throttling
  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = window.setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const now = Date.now();
          // Throttle progress updates to prevent excessive calls (minimum 1 second apart)
          if (now - lastProgressUpdateRef.current < 1000) {
            return;
          }
          
          const currentTime = playerRef.current.getCurrentTime();
          const duration = (typeof playerRef.current.getDuration === 'function') 
            ? playerRef.current.getDuration() 
            : playerState.duration;
          
          // Only update if there's a significant change (0.5 second minimum)
          const timeDiff = Math.abs(currentTime - playerState.currentTime);
          if (timeDiff < 0.5 && currentTime !== duration) {
            return;
          }
          
          lastProgressUpdateRef.current = now;
          
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
          // Stop tracking on repeated errors to prevent memory leaks
          if (error instanceof Error && error.message.includes('unavailable')) {
            stopProgressTracking();
          }
        }
      } else {
        // Player no longer available, stop tracking
        stopProgressTracking();
      }
    }, 2000); // Update every 2 seconds
  }, [onProgress, playerState.duration, playerState.currentTime, stopProgressTracking]);

  // Initialize player
  const initializePlayer = useCallback(() => {
    if (!window.YT || !window.YT.Player || !videoId || !containerId) {
      return;
    }

    try {
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
          autohide: 0
        },
        events: {
          onReady: (event: any) => {
            console.log('YouTube player ready');
            playerRef.current = event.target;
            
            // Safely get duration on ready
            const duration = (typeof event.target.getDuration === 'function') 
              ? event.target.getDuration() || 0 
              : 0;
            
            setPlayerState(prev => ({ 
              ...prev, 
              player: event.target, 
              isReady: true,
              duration
            }));
            
            if (onReady) {
              onReady(event.target);
            }
          },
          onStateChange: (event: any) => {
            const state = event.data;
            console.log('YouTube player state changed:', state);
            
            // Safely get duration with proper checks
            let duration = 0;
            if (event.target && typeof event.target.getDuration === 'function') {
              try {
                duration = event.target.getDuration() || 0;
              } catch (error) {
                console.warn('Error getting YouTube video duration:', error);
                // Fallback to stored duration
                duration = playerState.duration;
              }
            } else {
              // Fallback to stored duration if method not available
              duration = playerState.duration;
            }
            
            setPlayerState(prev => ({ 
              ...prev, 
              playerState: state,
              isPlaying: state === 1, // 1 = playing
              duration
            }));

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
              if (onProgress && duration > 0) {
                onProgress(duration, duration);
              }
            }
          }
        }
      });

      playerRef.current = player;
    } catch (error) {
      console.error('Error initializing YouTube player:', error);
    }
  }, [videoId, containerId, onReady, onStateChange, playerState.duration, startProgressTracking, stopProgressTracking]);

  // Initialize player when API is ready
  useEffect(() => {
    if (window.YT && window.YT.Player && videoId && containerId) {
      initializePlayer();
    }
  }, [initializePlayer, videoId, containerId]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopProgressTracking();
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (error) {
          console.warn('Error destroying YouTube player:', error);
        }
      }
    };
  }, [stopProgressTracking]);

  // Player control methods
  const play = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      playerRef.current.playVideo();
    }
  }, []);

  const pause = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
      playerRef.current.pauseVideo();
    }
  }, []);

  const seekTo = useCallback((seconds: number) => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(seconds, true);
    }
  }, []);

  return {
    ...playerState,
    play,
    pause,
    seekTo,
    initializePlayer
  };
};
