
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Users, 
  BarChart3, 
  HelpCircle, 
  Bell, 
  User,
  LogOut,
  Menu
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import UserManagement from "./user-management/UserManagement";
import QuizManagement from "./QuizManagement";

const AdminManagementConsole = () => {
  const [activeSection, setActiveSection] = useState("overview");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  console.log('AdminManagementConsole rendering with activeSection:', activeSection);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
      navigate('/', { replace: true });
    }
  };

  const navigationItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "users", label: "Users", icon: Users },
    { id: "quizzes", label: "Quizzes", icon: HelpCircle },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "profile", label: "Profile", icon: User },
  ];

  const renderContent = () => {
    console.log('Rendering content for section:', activeSection);
    
    switch (activeSection) {
      case "overview":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Admin Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Welcome to the admin management console.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">Courses</h3>
                    <p className="text-sm text-gray-600">Manage course content</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">Users</h3>
                    <p className="text-sm text-gray-600">Manage user accounts</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">Quizzes</h3>
                    <p className="text-sm text-gray-600">Manage quiz questions</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        );
      case "courses":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Course Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Course management functionality will be implemented here.</p>
            </CardContent>
          </Card>
        );
      case "users":
        console.log('Rendering UserManagement component');
        return <UserManagement />;
      case "quizzes":
        console.log('Rendering QuizManagement component');
        return <QuizManagement />;
      case "notifications":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Notification Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Notification management functionality will be implemented here.</p>
            </CardContent>
          </Card>
        );
      case "profile":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Profile Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Profile management functionality will be implemented here.</p>
            </CardContent>
          </Card>
        );
      default:
        console.log('Unknown section, returning null');
        return null;
    }
  };

  console.log('AdminManagementConsole about to render');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header style={{ background: '#213C82' }} className="shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <a 
                href="https://newfrontieruniversity.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <img 
                  src="/lovable-uploads/126f6dae-4376-4b57-9955-f40fc6fa19e2.png" 
                  alt="New Frontier University" 
                  className="h-12 w-auto"
                />
              </a>
              <div className="flex items-center space-x-3">
                <BookOpen className="h-8 w-8 text-white" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Admin Console</h1>
                  <p className="text-blue-100">
                    {user?.user_metadata?.first_name ? `Welcome back, ${user.user_metadata.first_name}!` : "Manage New Frontier University"}
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Navigation</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          console.log('Navigation clicked:', item.id);
                          setActiveSection(item.id);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                          activeSection === item.id 
                            ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700' 
                            : 'text-gray-700'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminManagementConsole;
