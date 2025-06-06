
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CourseContent from "./CourseContent";
import CourseCalendar from "./CourseCalendar";
import { useUserRole } from "@/hooks/useUserRole";

interface CourseMainContentProps {
  course: any;
  selectedUnit: any;
  courseTitle: string;
}

const CourseMainContent = ({ course, selectedUnit, courseTitle }: CourseMainContentProps) => {
  const [activeTab, setActiveTab] = useState("content");
  const { isAdmin } = useUserRole();

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full border-b rounded-none h-12">
          <TabsTrigger value="content" className="flex-1">Course Content</TabsTrigger>
          <TabsTrigger value="calendar" className="flex-1">Calendar</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="p-6">
          <CourseContent 
            unit={selectedUnit} 
            courseId={course.id} 
            courseTitle={courseTitle}
          />
        </TabsContent>
        
        <TabsContent value="calendar" className="p-6">
          <CourseCalendar courseId={course.id} isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseMainContent;
