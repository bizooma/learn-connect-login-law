
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Tables } from "@/integrations/supabase/types";
import CourseTreeNode from "./CourseTreeNode";
import EmptyCoursesState from "./EmptyCoursesState";
import { useDragHandler } from "./hooks/useDragHandler";
import { collectDraggableItems } from "./utils/draggableUtils";

type Course = Tables<'courses'>;
type Module = Tables<'modules'>;
type Lesson = Tables<'lessons'>;
type Unit = Tables<'units'>;
type Quiz = Tables<'quizzes'>;

interface CourseWithContent extends Course {
  modules: (Module & {
    lessons: (Lesson & {
      units: (Unit & {
        quizzes: Quiz[];
      })[];
    })[];
  })[];
}

interface LMSTreeContentProps {
  courses: CourseWithContent[];
  expandedCourses: Set<string>;
  expandedModules: Set<string>;
  expandedLessons: Set<string>;
  onToggleCourse: (courseId: string) => void;
  onToggleModule: (moduleId: string) => void;
  onToggleLesson: (lessonId: string) => void;
  onRefetch: () => void;
}

const LMSTreeContent = ({
  courses,
  expandedCourses,
  expandedModules,
  expandedLessons,
  onToggleCourse,
  onToggleModule,
  onToggleLesson,
  onRefetch
}: LMSTreeContentProps) => {
  const { handleDragEnd } = useDragHandler(onRefetch);

  if (courses.length === 0) {
    return <EmptyCoursesState />;
  }

  // Collect all draggable items for the sortable context
  const allDraggableItems = collectDraggableItems(courses);

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={allDraggableItems}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {courses.map((course) => (
              <CourseTreeNode
                key={course.id}
                course={course}
                isExpanded={expandedCourses.has(course.id)}
                onToggle={() => onToggleCourse(course.id)}
                expandedModules={expandedModules}
                expandedLessons={expandedLessons}
                onToggleModule={onToggleModule}
                onToggleLesson={onToggleLesson}
                onRefetch={onRefetch}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default LMSTreeContent;
