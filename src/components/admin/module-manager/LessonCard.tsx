
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Trash2, ChevronDown, ChevronRight, Plus, MoveUp, MoveDown } from 'lucide-react';
import { LessonData } from '../course-form/types';
import UnitCard from './UnitCard';
import LessonImageUpload from '../LessonImageUpload';

interface LessonCardProps {
  lesson: LessonData;
  lessonIndex: number;
  moduleIndex: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onUpdate: (field: string, value: any) => void;
  onDelete: () => void;
  onAddUnit: () => void;
  onUpdateUnit: (unitIndex: number, field: string, value: any) => void;
  onDeleteUnit: (unitIndex: number) => void;
  onVideoFileChange: (unitIndex: number, file: File) => void;
  onMoveLessonUp: () => void;
  onMoveLessonDown: () => void;
  canMoveLessonUp: boolean;
  canMoveLessonDown: boolean;
}

const LessonCard = ({
  lesson,
  lessonIndex,
  moduleIndex,
  isExpanded,
  onToggleExpanded,
  onUpdate,
  onDelete,
  onAddUnit,
  onUpdateUnit,
  onDeleteUnit,
  onVideoFileChange,
  onMoveLessonUp,
  onMoveLessonDown,
  canMoveLessonUp,
  canMoveLessonDown
}: LessonCardProps) => {
  const handleLessonImageUpdate = (imageUrl: string | null) => {
    onUpdate('image_url', imageUrl || '');
  };

  const visibleUnits = lesson.units.filter(unit => !unit._deletedInForm);

  return (
    <Card className="border-green-200 ml-4">
      <CardHeader className="bg-green-50 py-2">
        <CardTitle className="flex items-center justify-between text-base">
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
            <span>Lesson {lessonIndex + 1}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMoveLessonUp}
              disabled={!canMoveLessonUp}
              className="p-1"
            >
              <MoveUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onMoveLessonDown}
              disabled={!canMoveLessonDown}
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
            <Label>Lesson Title</Label>
            <Input
              value={lesson.title}
              onChange={(e) => onUpdate('title', e.target.value)}
              placeholder="Enter lesson title"
            />
          </div>
          
          <div>
            <Label>Lesson Description</Label>
            <Textarea
              value={lesson.description}
              onChange={(e) => onUpdate('description', e.target.value)}
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
              <h5 className="font-medium">Units ({visibleUnits.length})</h5>
              <Button
                variant="outline"
                size="sm"
                onClick={onAddUnit}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Unit
              </Button>
            </div>

            {visibleUnits.map((unit, unitIndex) => {
              const originalIndex = lesson.units.findIndex(u => u === unit);
              
              return (
                <UnitCard
                  key={originalIndex}
                  unit={unit}
                  unitIndex={originalIndex}
                  lessonIndex={lessonIndex}
                  moduleIndex={moduleIndex}
                  onUpdateUnit={(unitIdx, field, value) => onUpdateUnit(unitIdx, field, value)}
                  onDeleteUnit={(unitIdx) => onDeleteUnit(unitIdx)}
                  onVideoFileChange={(unitIdx, file) => onVideoFileChange(unitIdx, file)}
                  onMoveUnitUp={() => {}}
                  onMoveUnitDown={() => {}}
                  canMoveUnitUp={false}
                  canMoveUnitDown={false}
                />
              );
            })}

            {visibleUnits.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No units in this lesson yet.</p>
                <p className="text-sm">Click "Add Unit" to create the first unit.</p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default LessonCard;
