
import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, Volume2, VolumeX, Maximize, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/integrations/supabase/types";
import VideoProgressTracker from "./VideoProgressTracker";
import { useReliableCompletion } from "@/hooks/useReliableCompletion";
import { logger } from "@/utils/logger";

type Unit = Tables<'units'>;

interface CourseVideoProps {
  unit: Unit | null;
  courseId: string;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const CourseVideo = ({ unit, courseId }: CourseVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupTimeoutRef = useRef<number>();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isYouTubeReady, setIsYouTubeReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [containerId] = useState(() => `youtube-player-${Math.random().toString(36).substr(2, 9)}`);
  
  const { markVideoComplete, evaluateAndCompleteUnit } = useReliableCompletion();

  // Extract video ID from YouTube URL
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  // Handle video completion
  const handleVideoComplete = useCallback(async () => {
    if (!unit) return;

    logger.log('🎥 Video completed for unit:', unit.id, unit.title);
    
    try {
      await markVideoComplete(unit.id, courseId);
      await evaluateAndCompleteUnit(unit, courseId, false, 'video_complete');
    } catch (error) {
      logger.error('❌ Error handling video completion:', error);
    }
  }, [unit, courseId, markVideoComplete, evaluateAndCompleteUnit]);

  // Cleanup YouTube player
  const cleanupYouTubePlayer = useCallback(() => {
    logger.log('🧹 Cleaning up YouTube player for unit:', unit?.id);
    
    if (youtubePlayerRef.current) {
      try {
        if (typeof youtubePlayerRef.current.destroy === 'function') {
          youtubePlayerRef.current.destroy();
        }
      } catch (error) {
        logger.warn('⚠️ Error destroying YouTube player:', error);
      }
      youtubePlayerRef.current = null;
    }

    // Clear container content
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Reset states
    setIsYouTubeReady(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
  }, [unit?.id]);

  // Load YouTube API
  const loadYouTubeAPI = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (window.YT && window.YT.Player) {
        resolve();
        return;
      }

      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
      }

      window.onYouTubeIframeAPIReady = () => {
        logger.log('✅ YouTube API loaded successfully');
        resolve();
      };

      // Fallback check
      const checkAPI = () => {
        if (window.YT && window.YT.Player) {
          resolve();
        } else {
          setTimeout(checkAPI, 100);
        }
      };
      setTimeout(checkAPI, 1000);
    });
  }, []);

  // Create YouTube player
  const createYouTubePlayer = useCallback(async (videoId: string) => {
    if (!containerRef.current || !unit) return;

    logger.log('🎬 Creating YouTube player for:', videoId, 'Unit:', unit.title);
    
    try {
      setIsLoading(true);
      setError(null);

      await loadYouTubeAPI();

      // Clear any existing content
      containerRef.current.innerHTML = `<div id="${containerId}"></div>`;

      const player = new window.YT.Player(containerId, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
          origin: window.location.origin,
          fs: 1,
          cc_load_policy: 0,
          iv_load_policy: 3,
          autohide: 0
        },
        events: {
          onReady: (event: any) => {
            logger.log('✅ YouTube player ready for unit:', unit.title);
            youtubePlayerRef.current = event.target;
            setIsYouTubeReady(true);
            setIsLoading(false);
            
            // Get duration
            try {
              const videoDuration = event.target.getDuration();
              if (videoDuration > 0) {
                setDuration(videoDuration);
              }
            } catch (error) {
              logger.warn('⚠️ Could not get video duration:', error);
            }
          },
          onStateChange: (event: any) => {
            const state = event.data;
            logger.log('🎵 YouTube player state changed:', state, 'for unit:', unit.title);
            
            setIsPlaying(state === 1); // 1 = playing
            
            if (state === 0) { // Ended
              handleVideoComplete();
            }
          },
          onError: (event: any) => {
            const errorCode = event.data;
            logger.error('❌ YouTube player error:', errorCode, 'for unit:', unit.title);
            
            let errorMessage = 'Video playback error';
            switch (errorCode) {
              case 2:
                errorMessage = 'Invalid video ID';
                break;
              case 5:
                errorMessage = 'HTML5 player error';
                break;
              case 100:
                errorMessage = 'Video not found or private';
                break;
              case 101:
              case 150:
                errorMessage = 'Video cannot be embedded';
                break;
            }
            
            setError(errorMessage);
            setIsLoading(false);
          }
        },
      });

      youtubePlayerRef.current = player;
    } catch (error) {
      logger.error('❌ Error creating YouTube player:', error);
      setError('Failed to load video player');
      setIsLoading(false);
    }
  }, [containerId, unit, loadYouTubeAPI, handleVideoComplete]);

  // Initialize YouTube player when unit changes
  useEffect(() => {
    if (!unit?.video_url || !isYouTubeUrl(unit.video_url)) {
      cleanupYouTubePlayer();
      return;
    }

    const videoId = getYouTubeVideoId(unit.video_url);
    if (!videoId) {
      setError('Invalid YouTube URL');
      return;
    }

    // Cleanup previous player first
    cleanupYouTubePlayer();

    // Small delay to ensure cleanup is complete
    cleanupTimeoutRef.current = window.setTimeout(() => {
      createYouTubePlayer(videoId);
    }, 100);

    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      cleanupYouTubePlayer();
    };
  }, [unit?.video_url, unit?.id, cleanupYouTubePlayer, createYouTubePlayer]);

  // Regular video player event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !unit?.video_url || isYouTubeUrl(unit.video_url)) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      handleVideoComplete();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [unit?.video_url, unit?.id, handleVideoComplete]);

  // Regular video controls
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = value[0];
    video.volume = newVolume / 100;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = (value[0] / 100) * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  const retryVideoLoad = () => {
    if (!unit?.video_url) return;
    
    console.log('🔄 Retrying video load for unit:', unit.title);
    setError(null);
    setIsLoading(true);
    
    if (isYouTubeUrl(unit.video_url)) {
      const videoId = getYouTubeVideoId(unit.video_url);
      if (videoId) {
        createYouTubePlayer(videoId);
      }
    }
  };

  if (!unit?.video_url) {
    return null;
  }

  const videoType = isYouTubeUrl(unit.video_url) ? 'youtube' : 'upload';

  return (
    <div className="space-y-4">
      <VideoProgressTracker
        unitId={unit.id}
        courseId={courseId}
        videoElement={videoType === 'upload' ? videoRef.current : null}
        youtubePlayer={videoType === 'youtube' ? youtubePlayerRef.current : null}
        videoType={videoType}
      />

      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {unit.title} - Video Content
            </CardTitle>
            {unit.duration_minutes && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{unit.duration_minutes} min</span>
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {videoType === 'youtube' ? (
            <div className="relative w-full bg-gray-900" style={{ paddingBottom: '56.25%' }}>
              <div
                ref={containerRef}
                className="absolute top-0 left-0 w-full h-full"
              />
              
              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p>Loading video...</p>
                  </div>
                </div>
              )}
              
              {/* Error overlay */}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
                  <div className="text-center text-white p-4">
                    <p className="mb-2">⚠️ {error}</p>
                    <Button
                      onClick={retryVideoLoad}
                      variant="outline"
                      size="sm"
                      className="text-white border-white hover:bg-white hover:text-gray-900"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative bg-black">
              <video
                ref={videoRef}
                src={unit.video_url}
                className="w-full h-auto max-h-[500px]"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              
              {/* Custom video controls for uploaded videos */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="space-y-3">
                  {/* Progress bar */}
                  <Slider
                    value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                    onValueChange={handleSeek}
                    max={100}
                    step={0.1}
                    className="w-full"
                  />
                  
                  {/* Controls */}
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={togglePlay}
                        className="text-white hover:bg-white/20"
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleMute}
                          className="text-white hover:bg-white/20"
                        >
                          {isMuted ? (
                            <VolumeX className="h-4 w-4" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <div className="w-20">
                          <Slider
                            value={[volume]}
                            onValueChange={handleVolumeChange}
                            max={100}
                            className="w-full"
                          />
                        </div>
                      </div>
                      
                      <span className="text-sm">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleFullscreen}
                      className="text-white hover:bg-white/20"
                    >
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseVideo;
