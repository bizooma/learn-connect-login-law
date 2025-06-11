
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Trash2, ChevronDown, ChevronRight, Plus, MoveUp, MoveDown } from 'lucide-react';
import { ModuleData } from '../course-form/types';
import LessonCard from './LessonCard';
import ModuleImageUpload from '../ModuleImageUpload';

interface ModuleCardProps {
  module: ModuleData;
  moduleIndex: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onUpdate: (field: string, value: any) => void;
  onDelete: () => void;
  onAddLesson: () => void;
  onUpdateLesson: (lessonIndex: number, field: string, value: any) => void;
  onDeleteLesson: (lessonIndex: number) => void;
  onAddUnit: (lessonIndex: number) => void;
  onUpdateUnit: (lessonIndex: number, unitIndex: number, field: string, value: any) => void;
  onDeleteUnit: (lessonIndex: number, unitIndex: number) => void;
  onVideoFileChange: (lessonIndex: number, unitIndex: number, file: File) => void;
  onMoveModuleUp: () => void;
  onMoveModuleDown: () => void;
  canMoveModuleUp: boolean;
  canMoveModuleDown: boolean;
  onMoveLessonUp: (lessonIndex: number) => void;
  onMoveLessonDown: (lessonIndex: number) => void;
}

const ModuleCard = ({
  module,
  moduleIndex,
  isExpanded,
  onToggleExpanded,
  onUpdate,
  onDelete,
  onAddLesson,
  onUpdateLesson,
  onDeleteLesson,
  onAddUnit,
  onUpdateUnit,
  onDeleteUnit,
  onVideoFileChange,
  onMoveModuleUp,
  onMoveModuleDown,
  canMoveModuleUp,
  canMoveModuleDown,
  onMoveLessonUp,
  onMoveLessonDown
}: ModuleCardProps) => {
  const handleModuleImageUpdate = (imageUrl: string | null) => {
    onUpdate('image_url', imageUrl || '');
  };

  return (
    <Card className="border-blue-200">
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpanded}
              className="p-1"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <span>Module {moduleIndex + 1}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMoveModuleUp}
              disabled={!canMoveModuleUp}
              className="p-1"
            >
              <MoveUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onMoveModuleDown}
              disabled={!canMoveModuleDown}
              className="p-1"
            >
              <MoveDown className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-4 space-y-4">
          <div>
            <Label>Module Title</Label>
            <Input
              value={module.title}
              onChange={(e) => onUpdate('title', e.target.value)}
              placeholder="Enter module title"
            />
          </div>
          
          <div>
            <Label>Module Description</Label>
            <Textarea
              value={module.description}
              onChange={(e) => onUpdate('description', e.target.value)}
              placeholder="Enter module description"
            />
          </div>

          <ModuleImageUpload
            currentImageUrl={module.image_url}
            onImageUpdate={handleModuleImageUpdate}
            moduleIndex={moduleIndex}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Lessons</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={onAddLesson}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Lesson
              </Button>
            </div>

            {module.lessons.map((lesson, lessonIndex) => (
              <LessonCard
                key={lessonIndex}
                lesson={lesson}
                lessonIndex={lessonIndex}
                moduleIndex={moduleIndex}
                isExpanded={true}
                onToggleExpanded={() => {}}
                onUpdate={(field, value) => onUpdateLesson(lessonIndex, field, value)}
                onDelete={() => onDeleteLesson(lessonIndex)}
                onAddUnit={() => onAddUnit(lessonIndex)}
                onUpdateUnit={(unitIndex, field, value) => onUpdateUnit(lessonIndex, unitIndex, field, value)}
                onDeleteUnit={(unitIndex) => onDeleteUnit(lessonIndex, unitIndex)}
                onVideoFileChange={(unitIndex, file) => onVideoFileChange(lessonIndex, unitIndex, file)}
                onMoveLessonUp={() => onMoveLessonUp(lessonIndex)}
                onMoveLessonDown={() => onMoveLessonDown(lessonIndex)}
                canMoveLessonUp={lessonIndex > 0}
                canMoveLessonDown={lessonIndex < module.lessons.length - 1}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ModuleCard;
