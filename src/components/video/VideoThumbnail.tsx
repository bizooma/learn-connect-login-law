
import { useState, useCallback } from 'react';
import { Play, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { extractYouTubeVideoId } from '@/utils/youTubeUtils';

interface VideoThumbnailProps {
  videoUrl: string;
  title?: string;
  className?: string;
  onPlayClick: () => void;
  isLoading?: boolean;
  hasError?: boolean;
  onRetry?: () => void;
}

const VideoThumbnail = ({ 
  videoUrl, 
  title, 
  className = "aspect-video", 
  onPlayClick,
  isLoading = false,
  hasError = false,
  onRetry 
}: VideoThumbnailProps) => {
  const [imageError, setImageError] = useState(false);
  const videoId = extractYouTubeVideoId(videoUrl);

  const getThumbnailUrl = useCallback(() => {
    if (!videoId) return null;
    
    // Try high quality thumbnail first, fallback to medium quality
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }, [videoId]);

  const getFallbackThumbnailUrl = useCallback(() => {
    if (!videoId) return null;
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }, [videoId]);

  const handleImageError = () => {
    if (!imageError && getFallbackThumbnailUrl()) {
      setImageError(true);
    }
  };

  const handlePlayClick = () => {
    if (!isLoading && !hasError) {
      onPlayClick();
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      setImageError(false);
      onRetry();
    }
  };

  const thumbnailUrl = imageError ? getFallbackThumbnailUrl() : getThumbnailUrl();

  if (hasError) {
    return (
      <div className={`bg-gray-100 rounded-lg flex flex-col items-center justify-center ${className}`}>
        <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
        <p className="text-gray-600 text-center mb-4">Unable to load video</p>
        {onRetry && (
          <Button 
            onClick={handleRetry}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-gray-100 rounded-lg overflow-hidden relative cursor-pointer group ${className}`}>
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt={title || 'Video thumbnail'}
          className="w-full h-full object-cover"
          onError={handleImageError}
          loading="lazy"
        />
      )}
      
      <div 
        className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all duration-200"
        onClick={handlePlayClick}
      >
        {isLoading ? (
          <div className="bg-white bg-opacity-90 rounded-full p-4">
            <RefreshCw className="h-8 w-8 text-gray-800 animate-spin" />
          </div>
        ) : (
          <div className="bg-white bg-opacity-90 rounded-full p-4 group-hover:bg-opacity-100 transition-all duration-200 shadow-lg">
            <Play className="h-8 w-8 text-gray-800" />
          </div>
        )}
      </div>
      
      {title && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          <p className="text-white text-sm font-medium truncate">{title}</p>
        </div>
      )}
    </div>
  );
};

export default VideoThumbnail;
