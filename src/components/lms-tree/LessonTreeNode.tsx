
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronDown, ChevronRight, FileText, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";
import UnitTreeNode from "./UnitTreeNode";
import { useReorderOperations } from "./hooks/useReorderOperations";

type Lesson = Tables<'lessons'>;
type Unit = Tables<'units'>;
type Quiz = Tables<'quizzes'>;

interface LessonWithUnits extends Lesson {
  units: (Unit & {
    quizzes: Quiz[];
  })[];
}

interface LessonTreeNodeProps {
  lesson: LessonWithUnits;
  lessonIndex: number;
  isExpanded: boolean;
  onToggle: () => void;
  availableTargets?: Array<{
    id: string;
    title: string;
    type: 'course' | 'module' | 'lesson';
  }>;
  onRefetch?: () => void;
}

const LessonTreeNode = ({
  lesson,
  lessonIndex,
  isExpanded,
  onToggle,
  availableTargets = [],
  onRefetch
}: LessonTreeNodeProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: `lesson-${lesson.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const { reorderLesson } = useReorderOperations(onRefetch || (() => {}));

  const totalQuizzes = lesson.units?.reduce((acc, unit) => 
    acc + (unit.quizzes?.length || 0), 0
  ) || 0;

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="bg-green-50 border-green-200 hover:shadow-sm transition-shadow border-l-4 border-l-green-500">
        <CardContent className="p-2">
          <div className="flex items-center space-x-3">
            <div
              {...attributes}
              {...listeners}
              className="flex items-center text-gray-400 hover:text-gray-600 cursor-grab"
            >
              <GripVertical className="h-3 w-3" />
            </div>
            
            {/* Reorder buttons */}
            <div className="flex flex-col space-y-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => reorderLesson(lesson.id, 'up')}
                className="h-4 w-4 p-0 hover:bg-green-100"
              >
                <ArrowUp className="h-2 w-2" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => reorderLesson(lesson.id, 'down')}
                className="h-4 w-4 p-0 hover:bg-green-100"
              >
                <ArrowDown className="h-2 w-2" />
              </Button>
            </div>
            
            <button
              onClick={onToggle}
              className="flex items-center text-green-600 hover:text-green-800"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>

            <FileText className="h-3 w-3 text-green-600 flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <h5 className="text-sm font-medium text-green-900 truncate">
                  Lesson {lessonIndex + 1}: {lesson.title}
                </h5>
                <span className="text-xs text-green-600">
                  {lesson.units?.length || 0} units
                </span>
                {totalQuizzes > 0 && (
                  <span className="text-xs text-green-600">
                    {totalQuizzes} quizzes
                  </span>
                )}
              </div>
              
              {lesson.description && (
                <p className="text-xs text-green-700 mt-1 truncate">
                  {lesson.description}
                </p>
              )}
            </div>
          </div>

          {isExpanded && lesson.units && lesson.units.length > 0 && (
            <div className="ml-6 mt-2 space-y-1">
              <SortableContext
                items={lesson.units.map(unit => `unit-${unit.id}`)}
                strategy={verticalListSortingStrategy}
              >
                {lesson.units.map((unit) => (
                  <UnitTreeNode
                    key={unit.id}
                    unit={unit}
                    availableTargets={availableTargets}
                    onRefetch={onRefetch}
                  />
                ))}
              </SortableContext>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LessonTreeNode;
