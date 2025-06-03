
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CourseManagement from "./CourseManagement";
import UserManagement from "./UserManagement";
import ProfileManagement from "./ProfileManagement";
import QuizManagement from "./QuizManagement";
import NotificationManagement from "./NotificationManagement";
import UserProgressManagement from "./UserProgressManagement";
import GamificationDashboard from "../gamification/GamificationDashboard";
import ActivityTrackingDashboard from "./activity/ActivityTrackingDashboard";

interface AdminManagementTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminManagementTabs = ({ activeTab, onTabChange }: AdminManagementTabsProps) => {
  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>Management Console</CardTitle>
        <CardDescription>
          Manage courses, users, quizzes, gamification, notifications, progress tracking, activity monitoring, and system settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList 
            className="grid w-full grid-cols-8"
            style={{ backgroundColor: '#FFDA00' }}
          >
            <TabsTrigger 
              value="courses"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
              style={{ color: 'black' }}
            >
              Courses
            </TabsTrigger>
            <TabsTrigger 
              value="gamification"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
              style={{ color: 'black' }}
            >
              Gamification
            </TabsTrigger>
            <TabsTrigger 
              value="users"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
              style={{ color: 'black' }}
            >
              Users
            </TabsTrigger>
            <TabsTrigger 
              value="progress"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
              style={{ color: 'black' }}
            >
              Progress
            </TabsTrigger>
            <TabsTrigger 
              value="activity"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
              style={{ color: 'black' }}
            >
              Activity
            </TabsTrigger>
            <TabsTrigger 
              value="quizzes"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
              style={{ color: 'black' }}
            >
              Quizzes
            </TabsTrigger>
            <TabsTrigger 
              value="notifications"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
              style={{ color: 'black' }}
            >
              Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="profile"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
              style={{ color: 'black' }}
            >
              Profile
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="courses" className="mt-6">
            <CourseManagement />
          </TabsContent>
          
          <TabsContent value="gamification" className="mt-6">
            <GamificationDashboard />
          </TabsContent>
          
          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>
          
          <TabsContent value="progress" className="mt-6">
            <UserProgressManagement />
          </TabsContent>
          
          <TabsContent value="activity" className="mt-6">
            <ActivityTrackingDashboard />
          </TabsContent>
          
          <TabsContent value="quizzes" className="mt-6">
            <QuizManagement />
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-6">
            <NotificationManagement />
          </TabsContent>
          
          <TabsContent value="profile" className="mt-6">
            <ProfileManagement />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminManagementTabs;
