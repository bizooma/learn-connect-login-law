
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tables } from "@/integrations/supabase/types";
import CourseVideo from "./CourseVideo";
import CourseContent from "./CourseContent";
import CourseSidebar from "./CourseSidebar";
import CourseCalendar from "./CourseCalendar";

type Section = Tables<'sections'>;
type Unit = Tables<'units'>;

interface SectionWithUnits extends Section {
  units: Unit[];
}

interface CourseMainContentProps {
  courseId: string;
  sections: SectionWithUnits[];
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
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <CourseSidebar
            sections={sections}
            selectedUnit={selectedUnit}
            onUnitSelect={onUnitSelect}
          />
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="video" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="video">Video</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
            </TabsList>

            <TabsContent value="video" className="mt-6">
              <CourseVideo unit={selectedUnit} />
            </TabsContent>

            <TabsContent value="content" className="mt-6">
              <CourseContent unit={selectedUnit} />
            </TabsContent>

            <TabsContent value="calendar" className="mt-6">
              <CourseCalendar courseId={courseId} isAdmin={isAdmin} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CourseMainContent;
