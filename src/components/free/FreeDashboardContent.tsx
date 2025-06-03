
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FreeResourcesTab from "./FreeResourcesTab";
import FreeProfileTab from "./FreeProfileTab";

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  law_firm_name: string;
  profile_image_url: string;
}

interface FreeDashboardContentProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  profile: ProfileData;
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
  userId: string;
}

const FreeDashboardContent = ({ 
  activeTab, 
  onTabChange, 
  profile, 
  setProfile, 
  userId 
}: FreeDashboardContentProps) => {
  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>Free User Portal</CardTitle>
        <CardDescription>
          Manage your profile and explore available free resources
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="resources">Free Resources</TabsTrigger>
            <TabsTrigger value="profile">My Profile</TabsTrigger>
          </TabsList>
          
          <TabsContent value="resources" className="mt-6">
            <FreeResourcesTab />
          </TabsContent>
          
          <TabsContent value="profile" className="mt-6">
            <FreeProfileTab 
              profile={profile}
              setProfile={setProfile}
              userId={userId}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FreeDashboardContent;
