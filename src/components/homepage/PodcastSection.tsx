
import { Play, Pause, Podcast, Loader2 } from "lucide-react";
import { usePodcastEpisodes } from "@/hooks/usePodcastEpisodes";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

const PodcastSection = () => {
  const { data: episodes = [], isLoading, error } = usePodcastEpisodes();
  const { play, currentEpisodeId, audioState } = useAudioPlayer();

  const handlePlayPause = (episodeId: string, audioUrl: string) => {
    play(episodeId, audioUrl);
  };

  const formatDuration = (duration: string | number) => {
    if (typeof duration === 'string' && duration.includes(':')) {
      return duration;
    }
    if (typeof duration === 'number') {
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return duration || '';
  };

  const getProgressPercentage = (episodeId: string) => {
    if (currentEpisodeId === episodeId && audioState.duration > 0) {
      return (audioState.currentTime / audioState.duration) * 100;
    }
    return 0;
  };

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Podcast Branding */}
          <div className="text-center lg:text-left">
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-8">
              Let's Get Rich PODCAST
            </h2>
            
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              This podcast is for entrepreneurs who want to live rich lives that leave a legacy. Your hosts, Hillary & Shawn Walsh, are an award-winning entrepreneur power couple. In this show, they share real-life, actionable advice on how to grow your law firm and make an impact.
            </p>

            {/* Podcast Player with New Image */}
            <div className="max-w-sm mx-auto lg:mx-0">
              <img 
                src="/lovable-uploads/01509898-2441-4731-b9a9-d242e1be7ed3.png"
                alt="Let's Get Rich Podcast - Hillary & Shawn Walsh"
                className="w-full h-auto rounded-3xl shadow-lg"
              />
            </div>
          </div>

          {/* Right Side - Episode List */}
          <div className="space-y-4">
            {isLoading && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
                <span className="ml-2 text-gray-600">Loading podcast episodes...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">Failed to load podcast episodes. Please try again later.</p>
              </div>
            )}

            {!isLoading && !error && episodes.map((episode) => (
              <div key={episode.id} className="bg-gray-900 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded flex items-center justify-center">
                      <Podcast className="w-6 h-6 text-black" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">{episode.title}</h3>
                      <p className="text-gray-400 text-xs line-clamp-2">{episode.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-400 text-xs">{formatDuration(episode.duration)}</span>
                    <button
                      onClick={() => handlePlayPause(episode.id, episode.audioUrl)}
                      disabled={!episode.audioUrl}
                      className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {currentEpisodeId === episode.id && audioState.isLoading ? (
                        <Loader2 className="w-4 h-4 text-black animate-spin" />
                      ) : currentEpisodeId === episode.id && audioState.isPlaying ? (
                        <Pause className="w-4 h-4 text-black" />
                      ) : (
                        <Play className="w-4 h-4 text-black ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Progress bar for playing episode */}
                {currentEpisodeId === episode.id && (
                  <div className="mt-3">
                    <div className="w-full h-1 bg-gray-700 rounded">
                      <div 
                        className="h-full bg-yellow-400 rounded transition-all duration-300" 
                        style={{ width: `${getProgressPercentage(episode.id)}%` }}
                      ></div>
                    </div>
                    {audioState.error && (
                      <p className="text-red-400 text-xs mt-1">{audioState.error}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {/* RSS Feed icon */}
            <div className="flex justify-end">
              <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PodcastSection;
