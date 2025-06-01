
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronDown, ChevronRight, BookOpen, GripVertical, Users, Clock, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ModuleTreeNode from "./ModuleTreeNode";
import { CourseWithContent } from "@/hooks/useLMSTreeData";

interface CourseTreeNodeProps {
  course: CourseWithContent;
  isExpanded: boolean;
  onToggle: () => void;
  expandedModules: Set<string>;
  expandedLessons: Set<string>;
  onToggleModule: (moduleId: string) => void;
  onToggleLesson: (lessonId: string) => void;
  onRefetch?: () => void;
}

const CourseTreeNode = ({
  course,
  isExpanded,
  onToggle,
  expandedModules,
  expandedLessons,
  onToggleModule,
  onToggleLesson,
  onRefetch
}: CourseTreeNodeProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: `course-${course.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const totalLessons = course.modules?.reduce((acc, module) => 
    acc + (module.lessons?.length || 0), 0
  ) || 0;

  const totalUnits = course.modules?.reduce((acc, module) => 
    acc + (module.lessons?.reduce((lessonAcc, lesson) => 
      lessonAcc + (lesson.units?.length || 0), 0
    ) || 0), 0
  ) || 0;

  const totalQuizzes = course.modules?.reduce((acc, module) => 
    acc + (module.lessons?.reduce((lessonAcc, lesson) => 
      lessonAcc + (lesson.units?.reduce((unitAcc, unit) => 
        unitAcc + (unit.quizzes?.length || 0), 0
      ) || 0), 0
    ) || 0), 0
  ) || 0;

  // Build available targets for reclassification
  const availableTargets = [
    {
      id: course.id,
      title: course.title,
      type: 'course' as const
    },
    ...course.modules.map(module => ({
      id: module.id,
      title: module.title,
      type: 'module' as const
    })),
    ...course.modules.flatMap(module => 
      module.lessons.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        type: 'lesson' as const
      }))
    )
  ];

  return (
    <div ref={setNodeRef} style={style} className="group">
      <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div
              {...attributes}
              {...listeners}
              className="flex items-center text-gray-400 hover:text-gray-600 cursor-grab"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            
            <button
              onClick={onToggle}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {course.title}
                </h3>
                <Badge variant="outline">{course.level}</Badge>
                <Badge variant="secondary">{course.category}</Badge>
              </div>
              
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>{course.students_enrolled || 0} students</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3" />
                  <span>{course.rating || 0}</span>
                </div>
                <span>{course.modules?.length || 0} modules</span>
                <span>{totalLessons} lessons</span>
                <span>{totalUnits} units</span>
                <span>{totalQuizzes} quizzes</span>
              </div>
            </div>
          </div>

          {isExpanded && course.modules && course.modules.length > 0 && (
            <div className="ml-8 mt-4 space-y-2">
              <SortableContext
                items={course.modules.map(module => `module-${module.id}`)}
                strategy={verticalListSortingStrategy}
              >
                {course.modules.map((module) => (
                  <ModuleTreeNode
                    key={module.id}
                    module={module}
                    isExpanded={expandedModules.has(module.id)}
                    onToggle={() => onToggleModule(module.id)}
                    expandedLessons={expandedLessons}
                    onToggleLesson={onToggleLesson}
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

export default CourseTreeNode;
