
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserCourseProgress from "../user/UserCourseProgress";

interface DashboardContentProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  userId: string;
  title: string;
  description: string;
  assignedTabLabel: string;
  completedTabLabel: string;
}

const DashboardContent = ({ 
  activeTab, 
  onTabChange, 
  userId, 
  title, 
  description,
  assignedTabLabel,
  completedTabLabel
}: DashboardContentProps) => {
  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assigned">{assignedTabLabel}</TabsTrigger>
            <TabsTrigger value="completed">{completedTabLabel}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="assigned" className="mt-6">
            <UserCourseProgress userId={userId} showOnlyAssigned={true} />
          </TabsContent>
          
          <TabsContent value="completed" className="mt-6">
            <UserCourseProgress userId={userId} showOnlyCompleted={true} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DashboardContent;
