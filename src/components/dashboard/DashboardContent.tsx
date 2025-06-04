
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import UserCourseProgress from "@/components/user/UserCourseProgress";

interface DashboardContentProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userId: string;
  title: string;
  description: string;
  assignedTabLabel: string;
  completedTabLabel: string;
  yellowTabs?: boolean;
}

const DashboardContent = ({
  activeTab,
  onTabChange,
  userId,
  title,
  description,
  assignedTabLabel,
  completedTabLabel,
  yellowTabs = false
}: DashboardContentProps) => {
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, [userId]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      // Fetch assigned courses (in_progress and not_started)
      const { data: assignedData } = await supabase
        .from('user_course_progress')
        .select(`
          *,
          courses (
            id,
            title,
            description,
            thumbnail_url,
            category
          )
        `)
        .eq('user_id', userId)
        .in('status', ['in_progress', 'not_started']);

      // Fetch completed courses
      const { data: completedData } = await supabase
        .from('user_course_progress')
        .select(`
          *,
          courses (
            id,
            title,
            description,
            thumbnail_url,
            category
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'completed');

      setAssignedCourses(assignedData || []);
      setCompletedCourses(completedData || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabsListStyle = yellowTabs ? { backgroundColor: '#FFDA00' } : {};
  const tabTriggerClassName = yellowTabs 
    ? "flex items-center data-[state=active]:bg-white data-[state=active]:text-black"
    : "flex items-center";
  const tabTriggerStyle = yellowTabs ? { color: 'black' } : {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <p className="text-gray-600">{description}</p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList 
            className="grid w-full grid-cols-2"
            style={tabsListStyle}
          >
            <TabsTrigger 
              value="assigned" 
              className={tabTriggerClassName}
              style={tabTriggerStyle}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {assignedTabLabel}
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              className={tabTriggerClassName}
              style={tabTriggerStyle}
            >
              <Award className="h-4 w-4 mr-2" />
              {completedTabLabel}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assigned" className="mt-6">
            <UserCourseProgress
              courses={assignedCourses}
              loading={loading}
              emptyMessage="No assigned courses yet."
            />
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <UserCourseProgress
              courses={completedCourses}
              loading={loading}
              emptyMessage="No completed courses yet."
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DashboardContent;
