
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { ModuleData } from './types';
import ModuleImageUpload from '../ModuleImageUpload';
import LessonForm from './LessonForm';

interface ModuleFormProps {
  module: ModuleData;
  moduleIndex: number;
  onModuleUpdate: (field: keyof ModuleData, value: any) => void;
  onModuleRemove: () => void;
  onAddLesson: () => void;
  onLessonUpdate: (lessonIndex: number, field: string, value: any) => void;
  onLessonRemove: (lessonIndex: number) => void;
  onAddUnit: (lessonIndex: number) => void;
  onUnitUpdate: (lessonIndex: number, unitIndex: number, field: string, value: any) => void;
  onUnitRemove: (lessonIndex: number, unitIndex: number) => void;
}

const ModuleForm = ({
  module,
  moduleIndex,
  onModuleUpdate,
  onModuleRemove,
  onAddLesson,
  onLessonUpdate,
  onLessonRemove,
  onAddUnit,
  onUnitUpdate,
  onUnitRemove
}: ModuleFormProps) => {
  const handleModuleImageUpdate = (imageUrl: string | null) => {
    onModuleUpdate('image_url', imageUrl || '');
  };

  return (
    <Card className="border-blue-200">
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex items-center justify-between">
          <span>Module {moduleIndex + 1}</span>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onModuleRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div>
          <Label>Module Title</Label>
          <Input
            value={module.title}
            onChange={(e) => onModuleUpdate('title', e.target.value)}
            placeholder="Enter module title"
          />
        </div>
        
        <div>
          <Label>Module Description</Label>
          <Textarea
            value={module.description}
            onChange={(e) => onModuleUpdate('description', e.target.value)}
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
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddLesson}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Lesson
            </Button>
          </div>

          {module.lessons.map((lesson, lessonIndex) => (
            <LessonForm
              key={lessonIndex}
              lesson={lesson}
              lessonIndex={lessonIndex}
              onLessonUpdate={(field, value) => onLessonUpdate(lessonIndex, field, value)}
              onLessonRemove={() => onLessonRemove(lessonIndex)}
              onAddUnit={() => onAddUnit(lessonIndex)}
              onUnitUpdate={(unitIndex, field, value) => onUnitUpdate(lessonIndex, unitIndex, field, value)}
              onUnitRemove={(unitIndex) => onUnitRemove(lessonIndex, unitIndex)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ModuleForm;
