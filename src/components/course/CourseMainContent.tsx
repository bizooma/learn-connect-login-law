
import { Tables } from "@/integrations/supabase/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CourseSidebar from "./CourseSidebar";
import CourseContent from "./CourseContent";
import CourseCalendar from "./CourseCalendar";

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
  console.log('CourseMainContent: Received isAdmin prop:', isAdmin);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <CourseSidebar 
            sections={sections} 
            selectedUnit={selectedUnit}
            onUnitSelect={onUnitSelect}
          />
        </div>
        <div className="lg:col-span-3">
          <Tabs defaultValue="content" className="w-full">
            <TabsList 
              className="grid w-full grid-cols-2" 
              style={{ backgroundColor: '#FFDA00' }}
            >
              <TabsTrigger 
                value="content"
                className="data-[state=active]:bg-white data-[state=active]:text-black"
                style={{ color: 'black' }}
              >
                Course Content
              </TabsTrigger>
              <TabsTrigger 
                value="calendar"
                className="data-[state=active]:bg-white data-[state=active]:text-black"
                style={{ color: 'black' }}
              >
                Calendar
              </TabsTrigger>
            </TabsList>
            <TabsContent value="content">
              <CourseContent unit={selectedUnit} courseId={courseId} />
            </TabsContent>
            <TabsContent value="calendar">
              <CourseCalendar courseId={courseId} isAdmin={isAdmin} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CourseMainContent;
