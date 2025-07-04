import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BadgeTemplateManagement from "./badges/BadgeTemplateManagement";
import BadgeAssignmentManagement from "./badges/BadgeAssignmentManagement";

const BadgeManagement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Badge Management</h2>
        <p className="text-muted-foreground">Create badge templates and assign them to users</p>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">Badge Templates</TabsTrigger>
          <TabsTrigger value="assignments">Badge Assignments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="space-y-4">
          <BadgeTemplateManagement />
        </TabsContent>
        
        <TabsContent value="assignments" className="space-y-4">
          <BadgeAssignmentManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BadgeManagement;