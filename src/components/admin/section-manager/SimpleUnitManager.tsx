
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, ArrowUp, ArrowDown, FileVideo, Youtube } from "lucide-react";
import { UnitData } from "./types";
import QuizSelector from "./QuizSelector";

interface SimpleUnitManagerProps {
  unit: UnitData;
  unitIndex: number;
  sectionIndex: number;
  totalSections: number;
  onUpdateUnit: (sectionIndex: number, unitIndex: number, field: keyof UnitData, value: any) => void;
  onDeleteUnit: (sectionIndex: number, unitIndex: number) => void;
  onVideoFileChange: (sectionIndex: number, unitIndex: number, file: File | null) => void;
  onMoveUnitUp: () => void;
  onMoveUnitDown: () => void;
  onMoveUnitToSection: (toSectionIndex: number) => void;
  canMoveUnitUp: boolean;
  canMoveUnitDown: boolean;
}

const SimpleUnitManager = ({
  unit,
  unitIndex,
  sectionIndex,
  totalSections,
  onUpdateUnit,
  onDeleteUnit,
  onVideoFileChange,
  onMoveUnitUp,
  onMoveUnitDown,
  onMoveUnitToSection,
  canMoveUnitUp,
  canMoveUnitDown,
}: SimpleUnitManagerProps) => {
  const handleVideoTypeChange = (videoType: 'youtube' | 'upload') => {
    onUpdateUnit(sectionIndex, unitIndex, 'video_type', videoType);
    if (videoType === 'youtube') {
      onVideoFileChange(sectionIndex, unitIndex, null);
    } else {
      onUpdateUnit(sectionIndex, unitIndex, 'video_url', '');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onVideoFileChange(sectionIndex, unitIndex, file);
  };

  const handleQuizUpdate = (quizId: string | undefined) => {
    onUpdateUnit(sectionIndex, unitIndex, 'quiz_id', quizId);
  };

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onMoveUnitUp}
                disabled={!canMoveUnitUp}
                className="h-6 w-6 p-0"
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onMoveUnitDown}
                disabled={!canMoveUnitDown}
                className="h-6 w-6 p-0"
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
            </div>
            <CardTitle className="text-sm">
              Unit {unitIndex + 1}
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {unit.video_type === 'youtube' ? (
                <><Youtube className="h-3 w-3 mr-1" />YouTube</>
              ) : (
                <><FileVideo className="h-3 w-3 mr-1" />Upload</>
              )}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            {totalSections > 1 && (
              <Select onValueChange={(value) => onMoveUnitToSection(parseInt(value))}>
                <SelectTrigger className="w-32 h-7 text-xs">
                  <SelectValue placeholder="Move to..." />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: totalSections }, (_, i) => (
                    <SelectItem key={i} value={i.toString()} disabled={i === sectionIndex}>
                      Section {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteUnit(sectionIndex, unitIndex)}
              className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`unit-title-${sectionIndex}-${unitIndex}`}>Unit Title</Label>
            <Input
              id={`unit-title-${sectionIndex}-${unitIndex}`}
              value={unit.title}
              onChange={(e) => onUpdateUnit(sectionIndex, unitIndex, 'title', e.target.value)}
              placeholder="Enter unit title"
            />
          </div>
          <div>
            <Label htmlFor={`unit-duration-${sectionIndex}-${unitIndex}`}>Duration (minutes)</Label>
            <Input
              id={`unit-duration-${sectionIndex}-${unitIndex}`}
              type="number"
              min="0"
              value={unit.duration_minutes}
              onChange={(e) => onUpdateUnit(sectionIndex, unitIndex, 'duration_minutes', parseInt(e.target.value) || 0)}
              placeholder="Duration in minutes"
            />
          </div>
        </div>

        <div>
          <Label htmlFor={`unit-description-${sectionIndex}-${unitIndex}`}>Description</Label>
          <Input
            id={`unit-description-${sectionIndex}-${unitIndex}`}
            value={unit.description}
            onChange={(e) => onUpdateUnit(sectionIndex, unitIndex, 'description', e.target.value)}
            placeholder="Enter unit description"
          />
        </div>

        <div>
          <Label htmlFor={`unit-content-${sectionIndex}-${unitIndex}`}>Content</Label>
          <Textarea
            id={`unit-content-${sectionIndex}-${unitIndex}`}
            value={unit.content}
            onChange={(e) => onUpdateUnit(sectionIndex, unitIndex, 'content', e.target.value)}
            placeholder="Enter unit content"
            rows={3}
          />
        </div>

        <div className="space-y-3">
          <div>
            <Label>Video Type</Label>
            <Select
              value={unit.video_type}
              onValueChange={handleVideoTypeChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube">YouTube Video</SelectItem>
                <SelectItem value="upload">Upload Video</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {unit.video_type === 'youtube' ? (
            <div>
              <Label htmlFor={`unit-video-url-${sectionIndex}-${unitIndex}`}>YouTube URL</Label>
              <Input
                id={`unit-video-url-${sectionIndex}-${unitIndex}`}
                value={unit.video_url}
                onChange={(e) => onUpdateUnit(sectionIndex, unitIndex, 'video_url', e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
          ) : (
            <div>
              <Label htmlFor={`unit-video-file-${sectionIndex}-${unitIndex}`}>Video File</Label>
              <Input
                id={`unit-video-file-${sectionIndex}-${unitIndex}`}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
              />
              {unit.video_url && (
                <p className="text-sm text-gray-600 mt-1">
                  Current file: {unit.video_file?.name || 'Uploaded file'}
                </p>
              )}
            </div>
          )}
        </div>

        <QuizSelector
          quizId={unit.quiz_id}
          onQuizUpdate={handleQuizUpdate}
        />
      </CardContent>
    </Card>
  );
};

export default SimpleUnitManager;
