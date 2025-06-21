
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, Volume2, VolumeX, Maximize, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/integrations/supabase/types";
import VideoProgressTracker from "./VideoProgressTracker";
import { useReliableCompletion } from "@/hooks/useReliableCompletion";

type Unit = Tables<'units'>;

interface CourseVideoProps {
  unit: Unit | null;
  courseId: string;
}

const CourseVideo = ({ unit, courseId }: CourseVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [youtubePlayer, setYoutubePlayer] = useState<any>(null);
  const [isYouTubeReady, setIsYouTubeReady] = useState(false);
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
  const handleVideoComplete = async () => {
    if (!unit) return;

    console.log('🎥 Video completed for unit:', unit.id);
    
    try {
      // Mark video as completed
      await markVideoComplete(unit.id, courseId);
      
      // Evaluate if unit should be completed (this will check if quiz is also needed)
      await evaluateAndCompleteUnit(unit, courseId, false, 'video_complete');
    } catch (error) {
      console.error('❌ Error handling video completion:', error);
    }
  };

  // YouTube player setup
  useEffect(() => {
    if (!unit?.video_url || !isYouTubeUrl(unit.video_url)) return;

    const videoId = getYouTubeVideoId(unit.video_url);
    if (!videoId) return;

    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        createYouTubePlayer(videoId);
      };
    } else {
      createYouTubePlayer(videoId);
    }

    function createYouTubePlayer(videoId: string) {
      const player = new window.YT.Player(`youtube-player-${unit.id}`, {
        height: '400',
        width: '100%',
        videoId: videoId,
        playerVars: {
          playsinline: 1,
          rel: 0,
          modestbranding: 1
        },
        events: {
          onReady: () => {
            setIsYouTubeReady(true);
            setYoutubePlayer(player);
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              handleVideoComplete();
            }
          }
        },
      });
    }

    return () => {
      if (youtubePlayer && typeof youtubePlayer.destroy === 'function') {
        youtubePlayer.destroy();
      }
    };
  }, [unit?.video_url, unit?.id]);

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
  }, [unit?.video_url, unit?.id]);

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
        youtubePlayer={videoType === 'youtube' ? youtubePlayer : null}
        videoType={videoType}
      />

      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Video Content</CardTitle>
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
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <div
                id={`youtube-player-${unit.id}`}
                className="absolute top-0 left-0 w-full h-full"
              />
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
              
              {/* Custom video controls */}
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
