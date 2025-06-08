
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

  // Find the lesson that contains the selected unit
  const currentLesson = course?.lessons?.find((lesson: any) => 
    lesson.units?.some((unit: any) => unit.id === selectedUnit?.id)
  );

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full border-b rounded-none h-12">
          <TabsTrigger value="content" className="flex-1">Course Content</TabsTrigger>
          <TabsTrigger value="calendar" className="flex-1">Calendar</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="p-6">
          <div className="max-w-full break-words">
            <CourseContent 
              unit={selectedUnit} 
              lesson={currentLesson}
              courseId={course.id} 
              courseTitle={courseTitle}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="calendar" className="p-6">
          <CourseCalendar courseId={course.id} isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseMainContent;
