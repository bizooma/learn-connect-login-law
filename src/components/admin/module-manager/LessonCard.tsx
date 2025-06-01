
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ArrowUp, ArrowDown, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import UnitCard from "./UnitCard";

interface LessonData {
  id?: string;
  title: string;
  description: string;
  image_url?: string;
  sort_order: number;
  units: UnitData[];
}

interface UnitData {
  id?: string;
  title: string;
  description: string;
  content: string;
  video_url: string;
  video_type: 'youtube' | 'upload';
  video_file?: File;
  duration_minutes: number;
  sort_order: number;
  quiz_id?: string;
}

interface LessonCardProps {
  lesson: LessonData;
  moduleIndex: number;
  lessonIndex: number;
  onUpdateLesson: (moduleIndex: number, lessonIndex: number, field: keyof LessonData, value: any) => void;
  onDeleteLesson: (moduleIndex: number, lessonIndex: number) => void;
  onAddUnit: (moduleIndex: number, lessonIndex: number) => void;
  onUpdateUnit: (moduleIndex: number, lessonIndex: number, unitIndex: number, field: keyof UnitData, value: any) => void;
  onDeleteUnit: (moduleIndex: number, lessonIndex: number, unitIndex: number) => void;
  onVideoFileChange: (moduleIndex: number, lessonIndex: number, unitIndex: number, file: File | null) => void;
  onLessonImageUpdate: (moduleIndex: number, lessonIndex: number, imageUrl: string | null) => void;
  canMoveLessonUp: boolean;
  canMoveLessonDown: boolean;
  onMoveLessonUp: () => void;
  onMoveLessonDown: () => void;
  onMoveUnitUp: (lessonIndex: number, unitIndex: number) => void;
  onMoveUnitDown: (lessonIndex: number, unitIndex: number) => void;
}

const LessonCard = ({
  lesson,
  moduleIndex,
  lessonIndex,
  onUpdateLesson,
  onDeleteLesson,
  onAddUnit,
  onUpdateUnit,
  onDeleteUnit,
  onVideoFileChange,
  onLessonImageUpdate,
  canMoveLessonUp,
  canMoveLessonDown,
  onMoveLessonUp,
  onMoveLessonDown,
  onMoveUnitUp,
  onMoveUnitDown,
}: LessonCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border border-green-200 ml-4">
      <CardHeader className="bg-green-50 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <div className="flex-1 space-y-2">
              <Input
                value={lesson.title}
                onChange={(e) => onUpdateLesson(moduleIndex, lessonIndex, 'title', e.target.value)}
                placeholder="Lesson title"
                className="font-medium"
              />
              <Textarea
                value={lesson.description}
                onChange={(e) => onUpdateLesson(moduleIndex, lessonIndex, 'description', e.target.value)}
                placeholder="Lesson description"
                rows={1}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex flex-col space-y-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onMoveLessonUp}
                disabled={!canMoveLessonUp}
                className="p-1"
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onMoveLessonDown}
                disabled={!canMoveLessonDown}
                className="p-1"
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAddUnit(moduleIndex, lessonIndex)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Unit
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onDeleteLesson(moduleIndex, lessonIndex)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-4">
          <div className="space-y-3">
            {lesson.units.map((unit, unitIndex) => (
              <UnitCard
                key={unitIndex}
                unit={unit}
                moduleIndex={moduleIndex}
                lessonIndex={lessonIndex}
                unitIndex={unitIndex}
                onUpdateUnit={onUpdateUnit}
                onDeleteUnit={onDeleteUnit}
                onVideoFileChange={onVideoFileChange}
                canMoveUnitUp={unitIndex > 0}
                canMoveUnitDown={unitIndex < lesson.units.length - 1}
                onMoveUnitUp={() => onMoveUnitUp(lessonIndex, unitIndex)}
                onMoveUnitDown={() => onMoveUnitUp(lessonIndex, unitIndex)}
              />
            ))}
            {lesson.units.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <p>No units yet. Click "Add Unit" to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default LessonCard;
