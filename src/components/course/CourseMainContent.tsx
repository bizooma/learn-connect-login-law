
import { Tables } from "@/integrations/supabase/types";
import CourseSidebar from "./CourseSidebar";
import CourseContent from "./CourseContent";

type Section = Tables<'sections'>;
type Unit = Tables<'units'>;

interface CourseMainContentProps {
  courseId: string;
  sections: (Section & { units: Unit[] })[];
  selectedUnit: Unit | null;
  onUnitSelect: (unit: Unit) => void;
  isAdmin: boolean;
}

const CourseMainContent = ({ 
  courseId,
  sections, 
  selectedUnit, 
  onUnitSelect, 
  isAdmin 
}: CourseMainContentProps) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <CourseSidebar
            sections={sections}
            selectedUnit={selectedUnit}
            onUnitSelect={onUnitSelect}
            isAdmin={isAdmin}
          />
        </div>
        <div className="lg:col-span-3">
          <CourseContent unit={selectedUnit} courseId={courseId} />
        </div>
      </div>
    </div>
  );
};

export default CourseMainContent;
