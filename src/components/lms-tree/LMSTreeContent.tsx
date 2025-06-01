
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { BookOpen } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import CourseTreeNode from "./CourseTreeNode";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Course = Tables<'courses'>;
type Module = Tables<'modules'>;
type Section = Tables<'sections'>;
type Unit = Tables<'units'>;
type Quiz = Tables<'quizzes'>;

interface CourseWithContent extends Course {
  modules: (Module & {
    sections: (Section & {
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
  expandedSections: Set<string>;
  onToggleCourse: (courseId: string) => void;
  onToggleModule: (moduleId: string) => void;
  onToggleSection: (sectionId: string) => void;
  onRefetch: () => void;
}

const LMSTreeContent = ({
  courses,
  expandedCourses,
  expandedModules,
  expandedSections,
  onToggleCourse,
  onToggleModule,
  onToggleSection,
  onRefetch
}: LMSTreeContentProps) => {
  const { toast } = useToast();
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    console.log('Drag ended:', { active: active.id, over: over.id });
    
    try {
      const activeId = active.id as string;
      const overId = over.id as string;
      
      // Parse the active item type and ID
      const [activeType, activeItemId] = activeId.split('-');
      const [overType, overItemId] = overId.split('-');
      
      console.log('Reclassification attempt:', { activeType, activeItemId, overType, overItemId });
      
      // Handle reclassification based on drag target
      if (activeType === 'section' && overType === 'course') {
        // Reclassify section to module
        const { data, error } = await supabase.rpc('reclassify_section_to_module', {
          p_section_id: activeItemId,
          p_course_id: overItemId
        });
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Section reclassified to module successfully",
        });
        
        onRefetch();
      } else if (activeType === 'unit' && overType === 'module') {
        // Reclassify unit to section
        const { data, error } = await supabase.rpc('reclassify_unit_to_section', {
          p_unit_id: activeItemId,
          p_module_id: overItemId
        });
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Unit reclassified to section successfully",
        });
        
        onRefetch();
      } else if (activeType === 'section' && overType === 'module') {
        // Move section to different module
        const { data, error } = await supabase.rpc('move_content_to_level', {
          p_content_id: activeItemId,
          p_content_type: 'section',
          p_target_parent_id: overItemId,
          p_target_parent_type: 'module'
        });
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Section moved to module successfully",
        });
        
        onRefetch();
      } else if (activeType === 'unit' && overType === 'section') {
        // Move unit to different section
        const { data, error } = await supabase.rpc('move_content_to_level', {
          p_content_id: activeItemId,
          p_content_type: 'unit',
          p_target_parent_id: overItemId,
          p_target_parent_type: 'section'
        });
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Unit moved to section successfully",
        });
        
        onRefetch();
      }
    } catch (error) {
      console.error('Error during reclassification:', error);
      toast({
        title: "Error",
        description: "Failed to reclassify content",
        variant: "destructive",
      });
    }
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
          items={courses.map(course => `course-${course.id}`)}
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
                expandedSections={expandedSections}
                onToggleModule={onToggleModule}
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
