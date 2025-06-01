
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, Package, GripVertical, FolderOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import LessonTreeNode from "./LessonTreeNode";

type Module = Tables<'modules'>;
type Lesson = Tables<'lessons'>;
type Unit = Tables<'units'>;
type Quiz = Tables<'quizzes'>;

interface ModuleWithLessons extends Module {
  lessons: (Lesson & {
    units: (Unit & {
      quizzes: Quiz[];
    })[];
  })[];
}

interface ModuleTreeNodeProps {
  module: ModuleWithLessons;
  isExpanded: boolean;
  onToggle: () => void;
  expandedLessons: Set<string>;
  onToggleLesson: (lessonId: string) => void;
}

const ModuleTreeNode = ({
  module,
  isExpanded,
  onToggle,
  expandedLessons,
  onToggleLesson
}: ModuleTreeNodeProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: `module-${module.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const totalUnits = module.lessons?.reduce((acc, lesson) => 
    acc + (lesson.units?.length || 0), 0
  ) || 0;

  const totalQuizzes = module.lessons?.reduce((acc, lesson) => 
    acc + (lesson.units?.reduce((unitAcc, unit) => 
      unitAcc + (unit.quizzes?.length || 0), 0
    ) || 0), 0
  ) || 0;

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="bg-purple-50 border-purple-200 hover:shadow-sm transition-shadow border-l-4 border-l-purple-500">
        <CardContent className="p-3">
          <div className="flex items-center space-x-3">
            <div
              {...attributes}
              {...listeners}
              className="flex items-center text-gray-400 hover:text-gray-600 cursor-grab"
            >
              <GripVertical className="h-3 w-3" />
            </div>
            
            <button
              onClick={onToggle}
              className="flex items-center text-purple-600 hover:text-purple-800"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>

            <Package className="h-4 w-4 text-purple-600 flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <h4 className="font-medium text-purple-900 truncate">
                  {module.title}
                </h4>
                <span className="text-xs text-purple-600">
                  {module.lessons?.length || 0} lessons
                </span>
                {totalUnits > 0 && (
                  <span className="text-xs text-purple-600">
                    {totalUnits} units
                  </span>
                )}
                {totalQuizzes > 0 && (
                  <span className="text-xs text-purple-600">
                    {totalQuizzes} quizzes
                  </span>
                )}
              </div>
              
              {module.description && (
                <p className="text-xs text-purple-700 mt-1 truncate">
                  {module.description}
                </p>
              )}
            </div>
          </div>

          {isExpanded && module.lessons && module.lessons.length > 0 && (
            <div className="ml-6 mt-3 space-y-1">
              {module.lessons.map((lesson) => (
                <LessonTreeNode
                  key={lesson.id}
                  lesson={lesson}
                  isExpanded={expandedLessons.has(lesson.id)}
                  onToggle={() => onToggleLesson(lesson.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ModuleTreeNode;
