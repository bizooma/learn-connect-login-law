
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import DashboardContent from "@/components/dashboard/DashboardContent";

const TeamLeaderCoursesTab = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("assigned");

  if (!user) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <DashboardContent
      activeTab={activeTab}
      onTabChange={setActiveTab}
      userId={user.id}
      title="My Learning Progress"
      description="Track your assigned courses and completed training"
      assignedTabLabel="Assigned Courses"
      completedTabLabel="Completed Courses"
      yellowTabs={true}
    />
  );
};

export default TeamLeaderCoursesTab;
