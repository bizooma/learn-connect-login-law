
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Clock } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import UnifiedVideoPlayer from "../video/UnifiedVideoPlayer";
import { logger } from "@/utils/logger";

type Unit = Tables<'units'>;

interface SectionMainContentProps {
  sectionId: string;
  units: Unit[];
  selectedUnit: Unit | null;
  onUnitSelect: (unit: Unit) => void;
}

const SectionMainContent = ({ units, selectedUnit, onUnitSelect }: SectionMainContentProps) => {
  const handleVideoProgress = (currentTime: number, duration: number, watchPercentage: number) => {
    logger.log('Section video progress:', { currentTime, duration, watchPercentage });
    // TODO: Implement section video progress tracking if needed
  };

  const handleVideoComplete = () => {
    logger.log('Section video completed');
    // TODO: Implement section video completion tracking if needed
  };

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
                    <UnifiedVideoPlayer
                      videoUrl={selectedUnit.video_url}
                      title={selectedUnit.title}
                      onProgress={handleVideoProgress}
                      onComplete={handleVideoComplete}
                      className="aspect-video bg-gray-100 rounded-lg"
                    />
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
