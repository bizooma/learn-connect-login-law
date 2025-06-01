
import { useState } from "react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, BookOpen, GripVertical, Users, Clock, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/integrations/supabase/types";
import SectionTreeNode from "./SectionTreeNode";

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

interface CourseTreeNodeProps {
  course: CourseWithContent;
  isExpanded: boolean;
  onToggle: () => void;
  expandedSections: Set<string>;
  onToggleSection: (sectionId: string) => void;
}

const CourseTreeNode = ({
  course,
  isExpanded,
  onToggle,
  expandedSections,
  onToggleSection
}: CourseTreeNodeProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: course.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const totalUnits = course.sections?.reduce((acc, section) => 
    acc + (section.units?.length || 0), 0
  ) || 0;

  const totalQuizzes = course.sections?.reduce((acc, section) => 
    acc + (section.units?.reduce((unitAcc, unit) => 
      unitAcc + (unit.quizzes?.length || 0), 0
    ) || 0), 0
  ) || 0;

  return (
    <div ref={setNodeRef} style={style} className="group">
      <Card className="hover:shadow-md transition-shadow">
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
                <span>{course.sections?.length || 0} sections</span>
                <span>{totalUnits} units</span>
                <span>{totalQuizzes} quizzes</span>
              </div>
            </div>
          </div>

          {isExpanded && course.sections && course.sections.length > 0 && (
            <div className="ml-8 mt-4 space-y-2">
              {course.sections.map((section) => (
                <SectionTreeNode
                  key={section.id}
                  section={section}
                  isExpanded={expandedSections.has(section.id)}
                  onToggle={() => onToggleSection(section.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseTreeNode;
