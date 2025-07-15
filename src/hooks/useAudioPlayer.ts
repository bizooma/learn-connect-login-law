import { useState, useRef, useEffect, useCallback } from "react";

interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  error: string | null;
}

export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(null);
  const [audioState, setAudioState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isLoading: false,
    error: null,
  });

  const play = useCallback(async (episodeId: string, audioUrl: string) => {
    try {
      // If same episode, toggle play/pause
      if (currentEpisodeId === episodeId && audioRef.current) {
        if (audioState.isPlaying) {
          audioRef.current.pause();
          return;
        } else {
          await audioRef.current.play();
          return;
        }
      }

      // Stop current audio if playing different episode
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      // Create new audio element
      const audio = new Audio();
      audioRef.current = audio;
      setCurrentEpisodeId(episodeId);
      setAudioState(prev => ({ ...prev, isLoading: true, error: null }));

      // Set up event listeners
      audio.addEventListener('loadstart', () => {
        setAudioState(prev => ({ ...prev, isLoading: true }));
      });

      audio.addEventListener('canplay', () => {
        setAudioState(prev => ({ ...prev, isLoading: false }));
      });

      audio.addEventListener('loadedmetadata', () => {
        setAudioState(prev => ({ 
          ...prev, 
          duration: audio.duration,
          isLoading: false 
        }));
      });

      audio.addEventListener('timeupdate', () => {
        setAudioState(prev => ({ 
          ...prev, 
          currentTime: audio.currentTime 
        }));
      });

      audio.addEventListener('play', () => {
        setAudioState(prev => ({ ...prev, isPlaying: true }));
      });

      audio.addEventListener('pause', () => {
        setAudioState(prev => ({ ...prev, isPlaying: false }));
      });

      audio.addEventListener('ended', () => {
        setAudioState(prev => ({ 
          ...prev, 
          isPlaying: false, 
          currentTime: 0 
        }));
        setCurrentEpisodeId(null);
      });

      audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        setAudioState(prev => ({ 
          ...prev, 
          isLoading: false, 
          isPlaying: false,
          error: 'Failed to load audio' 
        }));
      });

      // Load and play
      audio.src = audioUrl;
      audio.load();
      await audio.play();

    } catch (error) {
      console.error('Play error:', error);
      setAudioState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isPlaying: false,
        error: 'Failed to play audio' 
      }));
    }
  }, [currentEpisodeId, audioState.isPlaying]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  return {
    play,
    pause,
    seek,
    currentEpisodeId,
    audioState,
  };
};