
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Clock } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Unit = Tables<'units'>;

interface CourseVideoProps {
  unit: Unit | null;
}

const CourseVideo = ({ unit }: CourseVideoProps) => {
  if (!unit) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">
            <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a unit to watch the video</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getVideoEmbedUrl = (url: string) => {
    // Convert YouTube watch URLs to embed URLs
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    // Convert YouTube short URLs to embed URLs
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    // Return as-is for other video URLs (embed URLs, etc.)
    return url;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{unit.title}</CardTitle>
            {unit.duration_minutes && (
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                {unit.duration_minutes} min
              </div>
            )}
          </div>
          {unit.description && (
            <p className="text-gray-600">{unit.description}</p>
          )}
        </CardHeader>
        <CardContent>
          {unit.video_url ? (
            <div className="aspect-video">
              <iframe
                src={getVideoEmbedUrl(unit.video_url)}
                className="w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={unit.title}
              />
            </div>
          ) : (
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No video available for this unit</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseVideo;
