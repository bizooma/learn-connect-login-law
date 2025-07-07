
import { logger } from '@/utils/logger';

/**
 * Extracts video ID from various YouTube URL formats
 */
export const extractYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;

  // Already a video ID (11 characters)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  // Various YouTube URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    /youtu\.be\/([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

/**
 * Generates a clean YouTube embed URL that avoids bot detection
 */
export const getCleanYouTubeEmbedUrl = (url: string, enableAPI: boolean = false): string => {
  const videoId = extractYouTubeVideoId(url);
  
  if (!videoId) {
    logger.warn('Could not extract video ID from URL:', url);
    return url;
  }

  // Use standard youtube.com domain (not youtube-nocookie.com)
  // This reduces bot detection triggers
  const baseUrl = 'https://www.youtube.com/embed/' + videoId;
  
  const params = new URLSearchParams();
  
  // Essential parameters only to avoid bot detection
  if (enableAPI) {
    params.set('enablejsapi', '1');
    params.set('origin', window.location.origin);
  }
  
  // Minimal styling parameters
  params.set('rel', '0'); // Don't show related videos
  params.set('modestbranding', '1'); // Minimal YouTube branding
  
  const paramString = params.toString();
  return paramString ? `${baseUrl}?${paramString}` : baseUrl;
};

/**
 * Checks if a URL is a YouTube URL
 */
export const isYouTubeUrl = (url: string): boolean => {
  if (!url) return false;
  
  return /(?:youtube\.com|youtu\.be)/i.test(url);
};

/**
 * Gets a unique container ID for YouTube player
 */
export const getYouTubeContainerId = (prefix: string = 'youtube-player'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};
