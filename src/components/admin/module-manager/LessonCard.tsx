
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Trash2, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import UnitCard from './UnitCard';

interface LessonData {
  id?: string;
  title: string;
  description: string;
  image_url?: string;
  sort_order: number;
  units: UnitData[];
  _deletedInForm?: boolean;
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
  _deletedInForm?: boolean;
}

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
  onVideoFileChange: (unitIndex: number, file: File | null) => void;
  onImageUpdate: (imageUrl: string | null) => void;
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
  onImageUpdate
}: LessonCardProps) => {
  // Filter out units marked as deleted in form
  const visibleUnits = lesson.units.filter(unit => !unit._deletedInForm);

  return (
    <Card className="mb-4 border-blue-200">
      <CardHeader className="bg-blue-50 pb-3">
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
              // Find the original index in the full units array
              const originalIndex = lesson.units.findIndex(u => u === unit);
              
              return (
                <UnitCard
                  key={originalIndex}
                  unit={unit}
                  unitIndex={originalIndex}
                  lessonIndex={lessonIndex}
                  moduleIndex={moduleIndex}
                  onUpdate={(field, value) => onUpdateUnit(originalIndex, field, value)}
                  onDelete={() => onDeleteUnit(originalIndex)}
                  onVideoFileChange={(file) => onVideoFileChange(originalIndex, file)}
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
