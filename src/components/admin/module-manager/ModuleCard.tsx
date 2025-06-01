
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronRight, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useState } from "react";
import LessonCard from "./LessonCard";

interface ModuleData {
  id?: string;
  title: string;
  description: string;
  image_url?: string;
  sort_order: number;
  lessons: LessonData[];
}

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

interface ModuleCardProps {
  module: ModuleData;
  moduleIndex: number;
  isExpanded: boolean;
  onToggleExpanded: (moduleIndex: number) => void;
  onUpdateModule: (index: number, field: keyof ModuleData, value: any) => void;
  onDeleteModule: (index: number) => void;
  onAddLesson: (moduleIndex: number) => void;
  onUpdateLesson: (moduleIndex: number, lessonIndex: number, field: keyof LessonData, value: any) => void;
  onDeleteLesson: (moduleIndex: number, lessonIndex: number) => void;
  onAddUnit: (moduleIndex: number, lessonIndex: number) => void;
  onUpdateUnit: (moduleIndex: number, lessonIndex: number, unitIndex: number, field: keyof UnitData, value: any) => void;
  onDeleteUnit: (moduleIndex: number, lessonIndex: number, unitIndex: number) => void;
  onVideoFileChange: (moduleIndex: number, lessonIndex: number, unitIndex: number, file: File | null) => void;
  onLessonImageUpdate: (moduleIndex: number, lessonIndex: number, imageUrl: string | null) => void;
  canMoveModuleUp: boolean;
  canMoveModuleDown: boolean;
  onMoveModuleUp: () => void;
  onMoveModuleDown: () => void;
  onMoveLessonUp: (lessonIndex: number) => void;
  onMoveLessonDown: (lessonIndex: number) => void;
  onMoveUnitUp: (lessonIndex: number, unitIndex: number) => void;
  onMoveUnitDown: (lessonIndex: number, unitIndex: number) => void;
}

const ModuleCard = ({
  module,
  moduleIndex,
  isExpanded,
  onToggleExpanded,
  onUpdateModule,
  onDeleteModule,
  onAddLesson,
  onUpdateLesson,
  onDeleteLesson,
  onAddUnit,
  onUpdateUnit,
  onDeleteUnit,
  onVideoFileChange,
  onLessonImageUpdate,
  canMoveModuleUp,
  canMoveModuleDown,
  onMoveModuleUp,
  onMoveModuleDown,
  onMoveLessonUp,
  onMoveLessonDown,
  onMoveUnitUp,
  onMoveUnitDown,
}: ModuleCardProps) => {
  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="bg-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpanded(moduleIndex)}
              className="p-1"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <div className="flex-1 space-y-2">
              <Input
                value={module.title}
                onChange={(e) => onUpdateModule(moduleIndex, 'title', e.target.value)}
                placeholder="Module title"
                className="font-semibold"
              />
              <Textarea
                value={module.description}
                onChange={(e) => onUpdateModule(moduleIndex, 'description', e.target.value)}
                placeholder="Module description"
                rows={2}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex flex-col space-y-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onMoveModuleUp}
                disabled={!canMoveModuleUp}
                className="p-1"
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onMoveModuleDown}
                disabled={!canMoveModuleDown}
                className="p-1"
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAddLesson(moduleIndex)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Lesson
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onDeleteModule(moduleIndex)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-4">
          <div className="space-y-4">
            {module.lessons.map((lesson, lessonIndex) => (
              <LessonCard
                key={lessonIndex}
                lesson={lesson}
                moduleIndex={moduleIndex}
                lessonIndex={lessonIndex}
                onUpdateLesson={onUpdateLesson}
                onDeleteLesson={onDeleteLesson}
                onAddUnit={onAddUnit}
                onUpdateUnit={onUpdateUnit}
                onDeleteUnit={onDeleteUnit}
                onVideoFileChange={onVideoFileChange}
                onLessonImageUpdate={onLessonImageUpdate}
                canMoveLessonUp={lessonIndex > 0}
                canMoveLessonDown={lessonIndex < module.lessons.length - 1}
                onMoveLessonUp={() => onMoveLessonUp(lessonIndex)}
                onMoveLessonDown={() => onMoveLessonDown(lessonIndex)}
                onMoveUnitUp={onMoveUnitUp}
                onMoveUnitDown={onMoveUnitDown}
              />
            ))}
            {module.lessons.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No lessons yet. Click "Add Lesson" to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ModuleCard;
