
import { Button } from "@/components/ui/button";
import { Play, Pause, Podcast } from "lucide-react";
import { useState } from "react";

const PodcastSection = () => {
  const [playingEpisode, setPlayingEpisode] = useState<number | null>(null);

  const episodes = [
    {
      id: 1,
      title: "#17 How Gratitude Transforms Culture | Law Firm",
      duration: "23:12",
      description: "Let's Get Rich by Hillary & Shawn Walsh"
    },
    {
      id: 2,
      title: "#18 Leading Through Change: A Law Firm's Journey",
      duration: "20:45",
      description: "Let's Get Rich by Hillary & Shawn Walsh"
    },
    {
      id: 3,
      title: "#19 Using Frustration as Fuel for Growth",
      duration: "16:33",
      description: "Let's Get Rich by Hillary & Shawn Walsh"
    },
    {
      id: 4,
      title: "#23 Season Finale: Theory of Constraints",
      duration: "18:27",
      description: "Let's Get Rich by Hillary & Shawn Walsh"
    }
  ];

  const togglePlay = (episodeId: number) => {
    setPlayingEpisode(playingEpisode === episodeId ? null : episodeId);
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

            {/* Podcast Player Mockup */}
            <div className="bg-gray-900 rounded-3xl p-6 max-w-sm mx-auto lg:mx-0">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-4 mb-4">
                <div className="bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded mb-2 inline-block">
                  NEW RELEASE
                </div>
                <div className="text-yellow-300 text-sm font-bold mb-1">PODCAST:</div>
                <div className="text-white text-xl font-bold mb-2">LET'S GET RICH</div>
                <div className="w-full h-20 bg-white/20 rounded mb-4 flex items-center justify-center">
                  <Podcast className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <div className="text-white text-center">
                <div className="text-lg font-semibold mb-4">Let's Get Rich</div>
                <div className="flex items-center justify-center space-x-6 mb-4">
                  <button className="w-8 h-8 flex items-center justify-center">
                    <div className="w-4 h-4 border-l-4 border-l-white"></div>
                  </button>
                  <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <Play className="w-6 h-6 text-black ml-1" />
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center">
                    <div className="w-4 h-4 border-r-4 border-r-white"></div>
                  </button>
                </div>
                <div className="w-full h-1 bg-gray-700 rounded mb-2">
                  <div className="w-1/3 h-full bg-white rounded"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Episode List */}
          <div className="space-y-4">
            {episodes.map((episode) => (
              <div key={episode.id} className="bg-gray-900 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded flex items-center justify-center">
                      <Podcast className="w-6 h-6 text-black" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">{episode.title}</h3>
                      <p className="text-gray-400 text-xs">{episode.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-400 text-xs">{episode.duration}</span>
                    <button
                      onClick={() => togglePlay(episode.id)}
                      className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      {playingEpisode === episode.id ? (
                        <Pause className="w-4 h-4 text-black" />
                      ) : (
                        <Play className="w-4 h-4 text-black ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Progress bar for playing episode */}
                {playingEpisode === episode.id && (
                  <div className="mt-3">
                    <div className="w-full h-1 bg-gray-700 rounded">
                      <div className="w-1/4 h-full bg-yellow-400 rounded"></div>
                    </div>
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
