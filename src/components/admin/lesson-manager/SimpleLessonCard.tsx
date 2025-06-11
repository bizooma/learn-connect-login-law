
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Trash2, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { SectionData } from './types';
import SimpleUnitManager from './SimpleUnitManager';

interface SimpleLessonCardProps {
  lesson: SectionData;
  lessonIndex: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onUpdate: (field: keyof SectionData, value: any) => void;
  onDelete: () => void;
  onAddUnit: () => void;
  onUpdateUnit: (unitIndex: number, field: keyof import('./types').UnitData, value: any) => void;
  onDeleteUnit: (unitIndex: number) => void;
  onVideoFileChange: (unitIndex: number, file: File | null) => void;
}

const SimpleLessonCard = ({
  lesson,
  lessonIndex,
  isExpanded,
  onToggleExpanded,
  onUpdate,
  onDelete,
  onAddUnit,
  onUpdateUnit,
  onDeleteUnit,
  onVideoFileChange
}: SimpleLessonCardProps) => {
  // Filter out units marked as deleted in form
  const visibleUnits = lesson.units.filter(unit => !unit._deletedInForm);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
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
            <span>Lesson {lessonIndex + 1}: {lesson.title || 'Untitled'}</span>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor={`lesson-title-${lessonIndex}`}>Title</Label>
            <Input
              id={`lesson-title-${lessonIndex}`}
              value={lesson.title}
              onChange={(e) => onUpdate('title', e.target.value)}
              placeholder="Enter lesson title"
            />
          </div>
          
          <div>
            <Label htmlFor={`lesson-description-${lessonIndex}`}>Description</Label>
            <Textarea
              id={`lesson-description-${lessonIndex}`}
              value={lesson.description}
              onChange={(e) => onUpdate('description', e.target.value)}
              placeholder="Enter lesson description"
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-semibold">Units ({visibleUnits.length})</h4>
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
              // Find the original index in the full units array
              const originalIndex = lesson.units.findIndex(u => u === unit);
              
              return (
                <SimpleUnitManager
                  key={originalIndex}
                  unit={unit}
                  unitIndex={originalIndex}
                  lessonIndex={lessonIndex}
                  totalLessons={1}
                  onUpdateUnit={(lessonIdx, unitIdx, field, value) => onUpdateUnit(unitIdx, field, value)}
                  onDeleteUnit={(lessonIdx, unitIdx) => onDeleteUnit(unitIdx)}
                  onVideoFileChange={(lessonIdx, unitIdx, file) => onVideoFileChange(unitIdx, file)}
                  onMoveUnitUp={() => {}}
                  onMoveUnitDown={() => {}}
                  onMoveUnitToLesson={() => {}}
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

export default SimpleLessonCard;
