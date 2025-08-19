
import { useState, useEffect, useRef, useCallback } from 'react';
import { youTubeAPIService } from '@/services/youTubeAPIService';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerState {
  player: any | null;
  isReady: boolean;
  isApiReady: boolean;
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
  onError?: (error: string) => void;
}

export const useYouTubePlayer = ({
  videoId,
  containerId,
  onStateChange,
  onProgress,
  onReady,
  onError
}: UseYouTubePlayerProps) => {
  const [playerState, setPlayerState] = useState<YouTubePlayerState>({
    player: null,
    isReady: false,
    isApiReady: false,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    playerState: -1
  });

  const progressIntervalRef = useRef<number>();
  const playerRef = useRef<any>(null);

  // Load YouTube API using centralized service
  useEffect(() => {
    const loadAPI = async () => {
      try {
        await youTubeAPIService.loadAPI();
        setPlayerState(prev => ({ ...prev, isApiReady: true }));
        console.log('✅ YouTube API ready from service');
      } catch (error) {
        console.error('❌ YouTube API failed to load:', error);
        if (onError) {
          onError(error instanceof Error ? error.message : 'YouTube API load failed');
        }
      }
    };

    // Check if API is already loaded
    if (youTubeAPIService.getState().isLoaded) {
      setPlayerState(prev => ({ ...prev, isApiReady: true }));
    } else {
      loadAPI();
    }

    // Listen for API state changes
    const unsubscribe = youTubeAPIService.onStateChange(() => {
      const apiState = youTubeAPIService.getState();
      setPlayerState(prev => ({ ...prev, isApiReady: apiState.isLoaded }));
      
      if (apiState.error && onError) {
        onError(apiState.error);
      }
    });

    return unsubscribe;
  }, [onError]);

  // Initialize player (FIXED: Removed dependency on playerState.isApiReady)
  const initializePlayer = useCallback(() => {
    if (!window.YT || !window.YT.Player || !videoId || !containerId) {
      console.warn('⚠️ Cannot initialize player: API not ready or missing params');
      return;
    }

    if (playerRef.current) {
      console.log('🔄 Player already exists, skipping initialization');
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
      if (onError) {
        onError(error instanceof Error ? error.message : 'YouTube player initialization failed');
      }
    }
  }, [videoId, containerId, onReady, onStateChange]);

  // Progress tracking
  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = window.setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          const duration = (typeof playerRef.current.getDuration === 'function') 
            ? playerRef.current.getDuration() 
            : playerState.duration;
          
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
    }, 2000); // Update every 2 seconds
  }, [onProgress]); // FIXED: Removed circular dependency

  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = undefined;
    }
  }, []);

  // Initialize player when API is ready (FIXED: Removed circular dependency)
  useEffect(() => {
    if (playerState.isApiReady && videoId && containerId && !playerState.player) {
      console.log('🎬 Initializing YouTube player with API ready');
      initializePlayer();
    }
  }, [playerState.isApiReady, videoId, containerId]);

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
