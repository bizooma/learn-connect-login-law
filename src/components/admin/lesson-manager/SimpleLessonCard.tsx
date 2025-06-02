
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from "lucide-react";
import LessonImageUpload from "../LessonImageUpload";
import SimpleUnitManager from "./SimpleUnitManager";
import { UnitData, SectionData } from "./types";
import FileUpload from "../FileUpload";

interface SimpleLessonCardProps {
  lesson: SectionData;
  lessonIndex: number;
  isExpanded: boolean;
  onToggleExpanded: (index: number) => void;
  onUpdateLesson: (index: number, field: keyof SectionData, value: any) => void;
  onDeleteLesson: (index: number) => void;
  onAddUnit: (lessonIndex: number) => void;
  onUpdateUnit: (lessonIndex: number, unitIndex: number, field: keyof UnitData, value: any) => void;
  onDeleteUnit: (lessonIndex: number, unitIndex: number) => void;
  onVideoFileChange: (lessonIndex: number, unitIndex: number, file: File | null) => void;
  onLessonImageUpdate: (lessonIndex: number, imageUrl: string | null) => void;
  onMoveLessonUp: () => void;
  onMoveLessonDown: () => void;
  onMoveUnitUp: (lessonIndex: number, unitIndex: number) => void;
  onMoveUnitDown: (lessonIndex: number, unitIndex: number) => void;
  onMoveUnitToLesson: (fromLessonIndex: number, unitIndex: number, toLessonIndex: number) => void;
  canMoveLessonUp: boolean;
  canMoveLessonDown: boolean;
  totalLessons: number;
}

const SimpleLessonCard = ({
  lesson,
  lessonIndex,
  isExpanded,
  onToggleExpanded,
  onUpdateLesson,
  onDeleteLesson,
  onAddUnit,
  onUpdateUnit,
  onDeleteUnit,
  onVideoFileChange,
  onLessonImageUpdate,
  onMoveLessonUp,
  onMoveLessonDown,
  onMoveUnitUp,
  onMoveUnitDown,
  onMoveUnitToLesson,
  canMoveLessonUp,
  canMoveLessonDown,
  totalLessons,
}: SimpleLessonCardProps) => {
  const handleToggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleExpanded(lessonIndex);
  };

  const handleAddUnit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Adding unit to lesson index:', lessonIndex);
    onAddUnit(lessonIndex);
  };

  return (
    <Card className="w-full border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex flex-col space-y-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onMoveLessonUp}
                disabled={!canMoveLessonUp}
                className="h-6 w-6 p-0"
                title="Move lesson up"
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onMoveLessonDown}
                disabled={!canMoveLessonDown}
                className="h-6 w-6 p-0"
                title="Move lesson down"
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
            </div>
            <CardTitle className="text-base flex items-center space-x-2">
              <span>Lesson {lessonIndex + 1}</span>
              <Badge variant="secondary" className="text-xs">
                {lesson.units.length} units
              </Badge>
            </CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleExpanded}
              className="flex items-center space-x-1"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Collapse</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  <span className="hidden sm:inline">Expand</span>
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteLesson(lessonIndex)}
              className="text-red-600 hover:text-red-700"
              title="Delete lesson"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`lesson-title-${lessonIndex}`}>Lesson Title</Label>
            <Input
              id={`lesson-title-${lessonIndex}`}
              value={lesson.title}
              onChange={(e) => onUpdateLesson(lessonIndex, 'title', e.target.value)}
              placeholder="Enter lesson title"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor={`lesson-description-${lessonIndex}`}>Description</Label>
            <Input
              id={`lesson-description-${lessonIndex}`}
              value={lesson.description}
              onChange={(e) => onUpdateLesson(lessonIndex, 'description', e.target.value)}
              placeholder="Enter lesson description"
              className="mt-1"
            />
          </div>
        </div>

        <LessonImageUpload
          currentImageUrl={lesson.image_url}
          onImageUpdate={(imageUrl) => onLessonImageUpdate(lessonIndex, imageUrl)}
          lessonIndex={lessonIndex}
        />

        <FileUpload
          currentFileUrl={lesson.file_url}
          currentFileName={lesson.file_name}
          onFileUpdate={(fileUrl, fileName, fileSize) => {
            onUpdateLesson(lessonIndex, 'file_url', fileUrl);
            onUpdateLesson(lessonIndex, 'file_name', fileName);
            onUpdateLesson(lessonIndex, 'file_size', fileSize);
          }}
          label="Lesson File"
          contentType="lesson"
          contentIndex={lessonIndex}
        />

        {isExpanded && (
          <div className="mt-6 space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-lg">Units</h4>
              <Button
                onClick={handleAddUnit}
                size="sm"
                variant="outline"
                type="button"
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Unit</span>
              </Button>
            </div>

            {lesson.units.length > 0 ? (
              <div className="space-y-3">
                {lesson.units.map((unit, unitIndex) => (
                  <SimpleUnitManager
                    key={unitIndex}
                    unit={unit}
                    unitIndex={unitIndex}
                    lessonIndex={lessonIndex}
                    totalLessons={totalLessons}
                    onUpdateUnit={onUpdateUnit}
                    onDeleteUnit={onDeleteUnit}
                    onVideoFileChange={onVideoFileChange}
                    onMoveUnitUp={() => onMoveUnitUp(lessonIndex, unitIndex)}
                    onMoveUnitDown={() => onMoveUnitDown(lessonIndex, unitIndex)}
                    onMoveUnitToLesson={(toLessonIndex) => onMoveUnitToLesson(lessonIndex, unitIndex, toLessonIndex)}
                    canMoveUnitUp={unitIndex > 0}
                    canMoveUnitDown={unitIndex < lesson.units.length - 1}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="space-y-2">
                  <Plus className="h-8 w-8 mx-auto text-gray-400" />
                  <p className="text-gray-500 font-medium">No units yet</p>
                  <p className="text-sm text-gray-400">Click "Add Unit" to create your first unit</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SimpleLessonCard;
