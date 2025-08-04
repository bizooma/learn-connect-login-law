
import { Tables } from "@/integrations/supabase/types";
import UnifiedVideoPlayer from "../video/UnifiedVideoPlayer";
import VideoProgressTracker from "./VideoProgressTracker";
import VideoCompletionStatus from "../video/VideoCompletionStatus";
import { useSimplifiedCompletion } from "@/hooks/useSimplifiedCompletion";
import { useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { logger } from "@/utils/logger";
import CompletionMonitor from "@/components/completion/CompletionMonitor";

type Unit = Tables<'units'>;

interface CourseVideoProps {
  unit: Unit | null;
  courseId: string;
}

const CourseVideo = ({ unit, courseId }: CourseVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { markUnitComplete } = useSimplifiedCompletion();

  // Handle video completion
  const handleVideoComplete = useCallback(async () => {
    if (!unit) return;

    logger.log('🎥 Video completed for unit:', unit.id, unit.title);
    await markUnitComplete(unit.id, courseId, 'video_complete');
  }, [unit, markUnitComplete, courseId]);

  const handleVideoProgress = useCallback((currentTime: number, duration: number, watchPercentage: number) => {
    logger.log('🎬 Video progress:', { currentTime, duration, watchPercentage, unit: unit?.title });
  }, [unit?.title]);

  if (!unit?.video_url) {
    return null;
  }

  return (
    <div className="space-y-4">
      <VideoProgressTracker
        unitId={unit.id}
        courseId={courseId}
        videoElement={videoRef.current}
        youtubePlayer={null}
        videoType="upload"
      />

      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {unit.title} - Video Content
            </CardTitle>
            {unit.duration_minutes && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{unit.duration_minutes} min</span>
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <UnifiedVideoPlayer
            videoUrl={unit.video_url}
            title={unit.title}
            onProgress={handleVideoProgress}
            onComplete={handleVideoComplete}
            className="aspect-video"
            autoLoad={true}
          />
        </CardContent>
      </Card>

      {/* Simplified completion monitor */}
      <CompletionMonitor />
    </div>
  );
};

export default CourseVideo;
