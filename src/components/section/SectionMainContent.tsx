
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Clock } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Unit = Tables<'units'>;

interface SectionMainContentProps {
  sectionId: string;
  units: Unit[];
  selectedUnit: Unit | null;
  onUnitSelect: (unit: Unit) => void;
}

const getYouTubeEmbedUrl = (url: string): string => {
  if (!url) return url;
  
  // If it's already an embed URL, return as is
  if (url.includes('/embed/')) return url;
  
  // Handle different YouTube URL formats
  let videoId = '';
  
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('watch?v=')[1].split('&')[0];
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split('?')[0];
  } else if (url.includes('youtube.com/embed/')) {
    return url; // Already in embed format
  }
  
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0&controls=1&disablekb=0&fs=1&iv_load_policy=3`;
  }
  
  return url; // Return original if not a YouTube URL
};

const SectionMainContent = ({ units, selectedUnit, onUnitSelect }: SectionMainContentProps) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Units Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Units</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {units.map((unit, index) => (
                  <button
                    key={unit.id}
                    onClick={() => onUnitSelect(unit)}
                    className={`w-full text-left p-3 hover:bg-gray-50 transition-colors border-l-4 ${
                      selectedUnit?.id === unit.id
                        ? 'border-l-blue-500 bg-blue-50'
                        : 'border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Play className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">
                          Unit {index + 1}
                        </span>
                      </div>
                      {unit.duration_minutes && (
                        <Badge variant="secondary" className="text-xs">
                          {unit.duration_minutes}m
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 truncate">
                      {unit.title}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {selectedUnit ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{selectedUnit.title}</CardTitle>
                  {selectedUnit.duration_minutes && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {selectedUnit.duration_minutes} minutes
                    </div>
                  )}
                </div>
                {selectedUnit.description && (
                  <p className="text-gray-600">{selectedUnit.description}</p>
                )}
              </CardHeader>
              <CardContent>
                {selectedUnit.video_url && (
                  <div className="mb-6">
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <iframe
                        src={getYouTubeEmbedUrl(selectedUnit.video_url)}
                        className="w-full h-full rounded-lg"
                        allowFullScreen
                        title={selectedUnit.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                  </div>
                )}
                {selectedUnit.content && (
                  <div className="prose max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: selectedUnit.content.replace(/\n/g, '<br>') }} />
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a unit to get started</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SectionMainContent;
