
import { useState, useEffect } from "react";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProgress } from "@/hooks/useUserProgress";

type Unit = Tables<'units'>;

interface CourseVideoProps {
  unit: Unit | null;
}

const CourseVideo = ({ unit }: CourseVideoProps) => {
  const { user } = useAuth();
  const { markUnitComplete } = useUserProgress(user?.id);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleMarkComplete = async () => {
    if (!unit || !user) return;

    setLoading(true);
    try {
      // You would need to get the course_id from context or props
      // For now, I'll use a placeholder - this should be passed down properly
      await markUnitComplete(unit.id, unit.section_id); // Using section_id as placeholder
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
                  src={unit.video_url}
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                  title={unit.title}
                />
              </div>
              
              {user && !isCompleted && (
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
