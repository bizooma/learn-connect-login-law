
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { BookOpen, User, Gift, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProfileImageUpload from "./admin/ProfileImageUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import NotificationBanner from "./notifications/NotificationBanner";

const FreeDashboard = () => {
  const { user, signOut } = useAuth();
  const { isFree } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("resources");
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    profile_image_url: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Redirect if not a free user
  useEffect(() => {
    if (!loading && !isFree) {
      navigate("/");
    }
  }, [isFree, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          profile_image_url: data.profile_image_url || ""
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpdate = (imageUrl: string | null) => {
    setProfile(prev => ({
      ...prev,
      profile_image_url: imageUrl || ""
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isFree) {
    return null; // Will redirect in useEffect
  }

  const stats = [
    {
      title: "Free Resources",
      value: "Coming Soon",
      description: "Free learning materials",
      icon: Gift,
      color: "text-emerald-600",
    },
    {
      title: "Profile Status",
      value: "Free User",
      description: "Current membership",
      icon: User,
      color: "text-blue-600",
    },
    {
      title: "Available Content",
      value: "Limited",
      description: "Access level",
      icon: BookOpen,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Free Dashboard
                </h1>
                <p className="text-gray-600 mt-1">
                  Welcome, {profile.first_name || "User"}! Explore our free resources.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={signOut}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notification Banner */}
        <NotificationBanner />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Free User Portal</CardTitle>
            <CardDescription>
              Manage your profile and explore available free resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="resources">Free Resources</TabsTrigger>
                <TabsTrigger value="profile">My Profile</TabsTrigger>
              </TabsList>
              
              <TabsContent value="resources" className="mt-6">
                <div className="text-center py-16">
                  <Gift className="h-16 w-16 mx-auto text-emerald-400 mb-6" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                    Free Resources Coming Soon
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-6">
                    We're preparing amazing free learning resources just for you. 
                    Stay tuned for updates on available content!
                  </p>
                  <div className="space-y-4 max-w-md mx-auto">
                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                      <span className="text-emerald-800 font-medium">Free Articles</span>
                      <span className="text-emerald-600 text-sm">Coming Soon</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                      <span className="text-emerald-800 font-medium">Basic Tutorials</span>
                      <span className="text-emerald-600 text-sm">Coming Soon</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                      <span className="text-emerald-800 font-medium">Resource Library</span>
                      <span className="text-emerald-600 text-sm">Coming Soon</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="profile" className="mt-6">
                <div className="max-w-2xl space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
                    
                    <ProfileImageUpload
                      currentImageUrl={profile.profile_image_url}
                      onImageUpdate={handleImageUpdate}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={profile.first_name}
                        onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={profile.last_name}
                        onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={profile.email}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {saving ? "Saving..." : "Save Profile"}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FreeDashboard;
