
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Tables } from "@/integrations/supabase/types";
import CourseTreeNode from "./CourseTreeNode";

type Course = Tables<'courses'>;
type Section = Tables<'sections'>;
type Unit = Tables<'units'>;
type Quiz = Tables<'quizzes'>;

interface CourseWithContent extends Course {
  sections: (Section & {
    units: (Unit & {
      quizzes: Quiz[];
    })[];
  })[];
}

interface LMSTreeContentProps {
  courses: CourseWithContent[];
  expandedCourses: Set<string>;
  expandedSections: Set<string>;
  onToggleCourse: (courseId: string) => void;
  onToggleSection: (sectionId: string) => void;
}

const LMSTreeContent = ({
  courses,
  expandedCourses,
  expandedSections,
  onToggleCourse,
  onToggleSection
}: LMSTreeContentProps) => {
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    console.log('Drag ended:', { active: active.id, over: over.id });
    // TODO: Implement drag and drop logic to reorder items
    // This would involve updating the sort_order in the database
  };

  if (courses.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first course.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={courses.map(course => course.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {courses.map((course) => (
              <CourseTreeNode
                key={course.id}
                course={course}
                isExpanded={expandedCourses.has(course.id)}
                onToggle={() => onToggleCourse(course.id)}
                expandedSections={expandedSections}
                onToggleSection={onToggleSection}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default LMSTreeContent;
