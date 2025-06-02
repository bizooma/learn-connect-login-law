
import { useState, useEffect } from "react";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProgress } from "@/hooks/useUserProgress";
import { supabase } from "@/integrations/supabase/client";

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
  const { user } = useAuth();
  const { markUnitComplete } = useUserProgress(user?.id);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check if unit is already completed when component mounts or unit changes
  useEffect(() => {
    const checkCompletionStatus = async () => {
      if (!unit || !user || !courseId) {
        setCheckingStatus(false);
        return;
      }

      try {
        setCheckingStatus(true);
        console.log('Checking completion status for unit:', unit.id, 'user:', user.id);
        
        const { data: progress, error } = await supabase
          .from('user_unit_progress')
          .select('completed')
          .eq('user_id', user.id)
          .eq('unit_id', unit.id)
          .eq('course_id', courseId)
          .maybeSingle();

        if (error) {
          console.error('Error checking unit completion status:', error);
        } else {
          const completed = progress?.completed || false;
          console.log('Unit completion status:', completed);
          setIsCompleted(completed);
        }
      } catch (error) {
        console.error('Error checking completion status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkCompletionStatus();
  }, [unit?.id, user?.id, courseId]);

  const handleMarkComplete = async () => {
    if (!unit || !user || !courseId) return;

    setLoading(true);
    try {
      await markUnitComplete(unit.id, courseId);
      setIsCompleted(true);
    } catch (error) {
      console.error('Error marking unit complete:', error);
    } finally {
      setLoading(false);
    }
  };

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
            {isCompleted && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
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
              
              {user && !isCompleted && !checkingStatus && (
                <div className="flex justify-end">
                  <Button 
                    onClick={handleMarkComplete}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {loading ? "Marking Complete..." : "Mark as Complete"}
                  </Button>
                </div>
              )}
              
              {isCompleted && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Unit completed!</span>
                  </div>
                </div>
              )}
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
