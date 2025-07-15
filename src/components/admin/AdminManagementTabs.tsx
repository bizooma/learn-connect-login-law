
import { useState, useEffect } from "react";
import AdminNavigationDropdown from "./AdminNavigationDropdown";
import CourseManagement from "./CourseManagement";
import UserManagementTabs from "./user-management/UserManagementTabs";
import QuizManagement from "./QuizManagement";
import NotificationManagement from "./NotificationManagement";
import UserProgressManagement from "./UserProgressManagement";
import GlobalEventManagement from "./GlobalEventManagement";
import AdminTeamManagement from "./team-management/AdminTeamManagement";
import ProfileManagement from "./ProfileManagement";
import UserActivityManagement from "./activity-tracking/UserActivityManagement";
import Leaderboards from "../../pages/Leaderboards";
import LawFirmManagement from "./LawFirmManagement";
import CompletionMonitoringDashboard from "./CompletionMonitoringDashboard";
import BadgeManagement from "./BadgeManagement";
import CertificateTemplateManagement from "./CertificateTemplateManagement";

interface AdminManagementTabsProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  quizId?: string | null;
}

const AdminManagementTabs = ({ 
  activeTab: initialActiveTab = "courses", 
  onTabChange,
  quizId 
}: AdminManagementTabsProps) => {
  const [activeTab, setActiveTab] = useState(initialActiveTab);

  // Update internal tab when prop changes
  useEffect(() => {
    setActiveTab(initialActiveTab);
  }, [initialActiveTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "courses":
        return <CourseManagement />;
      case "users":
        return <UserManagementTabs />;
      case "lawfirms":
        return <LawFirmManagement />;
      case "teams":
        return <AdminTeamManagement />;
      case "progress":
        return <UserProgressManagement />;
      case "completion":
        return <CompletionMonitoringDashboard />;
      case "activity":
        return <UserActivityManagement />;
      case "leaderboards":
        return <Leaderboards />;
      case "badges":
        return <BadgeManagement />;
      case "certificates":
        return <CertificateTemplateManagement />;
      case "quizzes":
        return <QuizManagement quizId={quizId} />;
      case "notifications":
        return <NotificationManagement />;
      case "events":
        return <GlobalEventManagement />;
      case "profile":
        return <ProfileManagement />;
      default:
        return <CourseManagement />;
    }
  };

  return (
    <div className="space-y-6">
      <AdminNavigationDropdown 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
      />
      
      <div className="space-y-4">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminManagementTabs;
