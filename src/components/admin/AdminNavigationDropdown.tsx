import { useState } from "react";
import { ChevronDown, BookOpen, Users, BarChart3, Settings, Award, FileText, Building, UserCheck, Activity, Trophy, Calendar, Bell, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface AdminNavigationDropdownProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

const AdminNavigationDropdown = ({ activeTab, onTabChange }: AdminNavigationDropdownProps) => {
  const navigationCategories = [
    {
      id: "content",
      label: "Content Management",
      icon: BookOpen,
      items: [
        { id: "courses", label: "Courses", icon: BookOpen },
        { id: "quizzes", label: "Quizzes", icon: FileText },
        { id: "badges", label: "Badges", icon: Award },
        { id: "certificates", label: "Certificates", icon: Award },
      ]
    },
    {
      id: "users",
      label: "User Management", 
      icon: Users,
      items: [
        { id: "users", label: "Users", icon: Users },
        { id: "lawfirms", label: "Law Firms", icon: Building },
        { id: "teams", label: "Team Progress", icon: UserCheck },
        { id: "progress", label: "All User Progress", icon: Activity },
      ]
    },
    {
      id: "analytics",
      label: "Analytics & Monitoring",
      icon: BarChart3,
      items: [
        { id: "completion", label: "Completion Monitoring", icon: UserCheck },
        { id: "leaderboards", label: "Leaderboards", icon: Trophy },
        { id: "activity", label: "User Activity", icon: Activity },
      ]
    },
    {
      id: "system", 
      label: "System Administration",
      icon: Settings,
      items: [
        { id: "events", label: "Events", icon: Calendar },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "profile", label: "Profile", icon: User },
      ]
    }
  ];

  // Find which category contains the active tab
  const getActiveCategory = () => {
    return navigationCategories.find(category => 
      category.items.some(item => item.id === activeTab)
    );
  };

  const activeCategory = getActiveCategory();

  return (
    <div className="w-full bg-yellow-400 px-4 py-3">
      <div className="flex flex-wrap gap-2">
        {navigationCategories.map((category) => {
          const CategoryIcon = category.icon;
          const isActive = activeCategory?.id === category.id;
          
          return (
            <DropdownMenu key={category.id}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`text-black hover:bg-white/20 transition-colors ${
                    isActive ? 'bg-white text-black font-medium' : ''
                  }`}
                >
                  <CategoryIcon className="h-4 w-4 mr-2" />
                  {category.label}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="w-56 bg-white shadow-lg border z-50"
              >
                {category.items.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      className={`flex items-center space-x-2 cursor-pointer ${
                        activeTab === item.id ? 'bg-blue-50 text-blue-700 font-medium' : ''
                      }`}
                    >
                      <ItemIcon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}
      </div>
    </div>
  );
};

export default AdminNavigationDropdown;