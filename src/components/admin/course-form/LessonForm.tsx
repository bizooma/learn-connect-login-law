
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { LessonData } from './types';
import LessonImageUpload from '../LessonImageUpload';
import UnitForm from './UnitForm';

interface LessonFormProps {
  lesson: LessonData;
  lessonIndex: number;
  onLessonUpdate: (field: string, value: any) => void;
  onLessonRemove: () => void;
  onAddUnit: () => void;
  onUnitUpdate: (unitIndex: number, field: string, value: any) => void;
  onUnitRemove: (unitIndex: number) => void;
}

const LessonForm = ({
  lesson,
  lessonIndex,
  onLessonUpdate,
  onLessonRemove,
  onAddUnit,
  onUnitUpdate,
  onUnitRemove
}: LessonFormProps) => {
  const handleLessonImageUpdate = (imageUrl: string | null) => {
    onLessonUpdate('image_url', imageUrl || '');
  };

  // Filter out units marked as deleted in form
  const visibleUnits = lesson.units.filter(unit => !unit._deletedInForm);

  return (
    <Card className="border-green-200 ml-4">
      <CardHeader className="bg-green-50 py-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Lesson {lessonIndex + 1}</span>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onLessonRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div>
          <Label>Lesson Title</Label>
          <Input
            value={lesson.title}
            onChange={(e) => onLessonUpdate('title', e.target.value)}
            placeholder="Enter lesson title"
          />
        </div>
        
        <div>
          <Label>Lesson Description</Label>
          <Textarea
            value={lesson.description}
            onChange={(e) => onLessonUpdate('description', e.target.value)}
            placeholder="Enter lesson description"
          />
        </div>

        <LessonImageUpload
          currentImageUrl={lesson.image_url}
          onImageUpdate={handleLessonImageUpdate}
          lessonIndex={lessonIndex}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="font-medium">Units</h5>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddUnit}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Unit
            </Button>
          </div>

          {visibleUnits.map((unit, unitIndex) => {
            // Find the original index in the full units array
            const originalIndex = lesson.units.findIndex(u => u === unit);
            
            return (
              <UnitForm
                key={originalIndex}
                unit={unit}
                onUnitChange={(field, value) => onUnitUpdate(originalIndex, field, value)}
                onRemove={() => onUnitRemove(originalIndex)}
                unitIndex={originalIndex}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default LessonForm;
