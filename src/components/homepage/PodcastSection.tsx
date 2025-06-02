
import { Button } from "@/components/ui/button";
import { Play, Pause, Podcast } from "lucide-react";
import { useState } from "react";

const PodcastSection = () => {
  const [playingEpisode, setPlayingEpisode] = useState<number | null>(null);

  const episodes = [
    {
      id: 1,
      title: "#26 Turning Crisis Into Opportunity",
      duration: "28:15",
      description: "Let's Get Rich by Hillary & Shawn Walsh"
    },
    {
      id: 2,
      title: "#25 Building Systems That Scale",
      duration: "31:42",
      description: "Let's Get Rich by Hillary & Shawn Walsh"
    },
    {
      id: 3,
      title: "#24 The Power of Delegation",
      duration: "26:18",
      description: "Let's Get Rich by Hillary & Shawn Walsh"
    },
    {
      id: 4,
      title: "#23 Season Finale: Theory of Constraints",
      duration: "18:27",
      description: "Let's Get Rich by Hillary & Shawn Walsh"
    },
    {
      id: 5,
      title: "#22 Mastering Client Relationships",
      duration: "24:33",
      description: "Let's Get Rich by Hillary & Shawn Walsh"
    },
    {
      id: 6,
      title: "#21 Financial Planning for Law Firms",
      duration: "29:07",
      description: "Let's Get Rich by Hillary & Shawn Walsh"
    },
    {
      id: 7,
      title: "#20 Technology in Modern Practice",
      duration: "22:54",
      description: "Let's Get Rich by Hillary & Shawn Walsh"
    },
    {
      id: 8,
      title: "#19 Using Frustration as Fuel for Growth",
      duration: "16:33",
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
