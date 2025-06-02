
import { useState, useEffect } from "react";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play } from "lucide-react";

type Unit = Tables<'units'>;

interface CourseVideoProps {
  unit: Unit | null;
  courseId: string;
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
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  return url; // Return original if not a YouTube URL
};

const CourseVideo = ({ unit, courseId }: CourseVideoProps) => {
  if (!unit) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <Play className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No unit selected</h3>
            <p className="text-gray-600">Select a unit from the sidebar to start learning.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const embedUrl = unit.video_url ? getYouTubeEmbedUrl(unit.video_url) : '';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{unit.title}</span>
          </CardTitle>
          {unit.description && (
            <p className="text-gray-600">{unit.description}</p>
          )}
          {unit.duration_minutes && (
            <p className="text-sm text-gray-500">
              Duration: {unit.duration_minutes} minutes
            </p>
          )}
        </CardHeader>
        <CardContent>
          {unit.video_url ? (
            <div className="space-y-4">
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <iframe
                  src={embedUrl}
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                  title={unit.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Play className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No video available for this unit</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseVideo;
