
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Award } from "lucide-react";
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
              userId={userId}
              showOnlyAssigned={true}
            />
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <UserCourseProgress
              userId={userId}
              showOnlyCompleted={true}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DashboardContent;
