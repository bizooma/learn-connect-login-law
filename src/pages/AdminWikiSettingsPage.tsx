import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminDashboardHeader from "@/components/admin/AdminDashboardHeader";
import WikiSidebar from "@/components/admin/wiki/WikiSidebar";
import { useWikiCategories } from "@/hooks/useWikiCategories";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const AdminWikiSettingsPage = () => {
  const navigate = useNavigate();
  const { categories } = useWikiCategories();
  const { isAdmin, loading } = useUserRole();
  const { toast } = useToast();

  const [orgName, setOrgName] = useState("New Frontier Immigration Law");
  const [industry, setIndustry] = useState("Legal");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/admin/wiki", { replace: true });
    }
  }, [isAdmin, loading, navigate]);

  const handleSave = () => {
    toast({ title: "Settings saved", description: "Your changes have been saved." });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="relative z-50">
        <AdminDashboardHeader triggerDemo={() => {}} />
      </div>

      <SidebarProvider>
        <div className="flex flex-1 w-full" style={{ height: "calc(100vh - 88px)" }}>
          <WikiSidebar
            categories={categories.map((c) => ({
              id: c.id,
              title: c.title,
              icon: c.icon_name,
              article_count: (c as any).article_count,
            }))}
            activeCategoryId={null}
            onCategorySelect={(id) => navigate("/admin/wiki", { state: { activeCategoryId: id } })}
          />

          <div className="flex-1 flex flex-col min-w-0">
            <div className="border-b border-border bg-background px-6 py-3 flex items-center gap-3">
              <SidebarTrigger />
              <div>
                <h2 className="text-lg font-semibold text-foreground">Settings</h2>
                <p className="text-xs text-muted-foreground">Manage organization settings</p>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>General</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="org">Organization name</Label>
                        <Input id="org" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        <Input id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone number</Label>
                        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(000) 000-0000" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website URL</Label>
                        <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleSave}>Save</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default AdminWikiSettingsPage;
