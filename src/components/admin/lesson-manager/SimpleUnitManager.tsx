
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
import UnitImageUpload from "../UnitImageUpload";

interface SimpleUnitManagerProps {
  unit: UnitData;
  unitIndex: number;
  lessonIndex: number;
  totalLessons: number;
  onUpdateUnit: (lessonIndex: number, unitIndex: number, field: keyof UnitData, value: any) => void;
  onDeleteUnit: (lessonIndex: number, unitIndex: number) => void;
  onVideoFileChange: (lessonIndex: number, unitIndex: number, file: File | null) => void;
  onMoveUnitUp: () => void;
  onMoveUnitDown: () => void;
  onMoveUnitToLesson: (toLessonIndex: number) => void;
  canMoveUnitUp: boolean;
  canMoveUnitDown: boolean;
}

const SimpleUnitManager = ({
  unit,
  unitIndex,
  lessonIndex,
  totalLessons,
  onUpdateUnit,
  onDeleteUnit,
  onVideoFileChange,
  onMoveUnitUp,
  onMoveUnitDown,
  onMoveUnitToLesson,
  canMoveUnitUp,
  canMoveUnitDown,
}: SimpleUnitManagerProps) => {
  const handleVideoTypeChange = (videoType: 'youtube' | 'upload') => {
    onUpdateUnit(lessonIndex, unitIndex, 'video_type', videoType);
    if (videoType === 'youtube') {
      onVideoFileChange(lessonIndex, unitIndex, null);
    } else {
      onUpdateUnit(lessonIndex, unitIndex, 'video_url', '');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onVideoFileChange(lessonIndex, unitIndex, file);
  };

  const handleQuizUpdate = (quizId: string | undefined) => {
    onUpdateUnit(lessonIndex, unitIndex, 'quiz_id', quizId);
  };

  const handleUnitImageUpdate = (imageUrl: string | null) => {
    onUpdateUnit(lessonIndex, unitIndex, 'image_url', imageUrl || '');
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
            {totalLessons > 1 && (
              <Select onValueChange={(value) => onMoveUnitToLesson(parseInt(value))}>
                <SelectTrigger className="w-32 h-7 text-xs">
                  <SelectValue placeholder="Move to..." />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: totalLessons }, (_, i) => (
                    <SelectItem key={i} value={i.toString()} disabled={i === lessonIndex}>
                      Lesson {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteUnit(lessonIndex, unitIndex)}
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
            <Label htmlFor={`unit-title-${lessonIndex}-${unitIndex}`}>Unit Title</Label>
            <Input
              id={`unit-title-${lessonIndex}-${unitIndex}`}
              value={unit.title}
              onChange={(e) => onUpdateUnit(lessonIndex, unitIndex, 'title', e.target.value)}
              placeholder="Enter unit title"
            />
          </div>
          <div>
            <Label htmlFor={`unit-duration-${lessonIndex}-${unitIndex}`}>Duration (minutes)</Label>
            <Input
              id={`unit-duration-${lessonIndex}-${unitIndex}`}
              type="number"
              min="0"
              value={unit.duration_minutes}
              onChange={(e) => onUpdateUnit(lessonIndex, unitIndex, 'duration_minutes', parseInt(e.target.value) || 0)}
              placeholder="Duration in minutes"
            />
          </div>
        </div>

        <div>
          <Label htmlFor={`unit-description-${lessonIndex}-${unitIndex}`}>Description</Label>
          <Input
            id={`unit-description-${lessonIndex}-${unitIndex}`}
            value={unit.description}
            onChange={(e) => onUpdateUnit(lessonIndex, unitIndex, 'description', e.target.value)}
            placeholder="Enter unit description"
          />
        </div>

        <UnitImageUpload
          currentImageUrl={unit.image_url}
          onImageUpdate={handleUnitImageUpdate}
          unitIndex={unitIndex}
          lessonIndex={lessonIndex}
        />

        <div>
          <Label htmlFor={`unit-content-${lessonIndex}-${unitIndex}`}>Content</Label>
          <Textarea
            id={`unit-content-${lessonIndex}-${unitIndex}`}
            value={unit.content}
            onChange={(e) => onUpdateUnit(lessonIndex, unitIndex, 'content', e.target.value)}
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
              <Label htmlFor={`unit-video-url-${lessonIndex}-${unitIndex}`}>YouTube URL</Label>
              <Input
                id={`unit-video-url-${lessonIndex}-${unitIndex}`}
                value={unit.video_url}
                onChange={(e) => onUpdateUnit(lessonIndex, unitIndex, 'video_url', e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
          ) : (
            <div>
              <Label htmlFor={`unit-video-file-${lessonIndex}-${unitIndex}`}>Video File</Label>
              <Input
                id={`unit-video-file-${lessonIndex}-${unitIndex}`}
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
