import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminDashboardHeader from "@/components/admin/AdminDashboardHeader";
import WikiSidebar from "@/components/admin/wiki/WikiSidebar";
import { useWikiCategories } from "@/hooks/useWikiCategories";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Loader2, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useGroups } from "@/hooks/useGroups";
import { invalidateGamificationCache } from "@/hooks/useGamificationSettings";

const EMPLOYEE_RANGES = ["1 - 10", "11 - 25", "26 - 100", "101 - 500", "500+"];
const INDUSTRIES = ["Legal", "Healthcare", "Technology", "Education", "Finance", "Retail", "Manufacturing", "Other"];

const AdminWikiSettingsPage = () => {
  const navigate = useNavigate();
  const { categories } = useWikiCategories();
  const { isAdmin, loading } = useUserRole();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [industry, setIndustry] = useState("Legal");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [logoBgColor, setLogoBgColor] = useState("#ffffff");
  const [accentColor, setAccentColor] = useState("#213C82");

  // Gamification
  const [gamificationEnabled, setGamificationEnabled] = useState(true);
  const [streakFrequency, setStreakFrequency] = useState<"weekly" | "monthly" | "quarterly">("weekly");
  const [excludedGroups, setExcludedGroups] = useState<string[]>([]);
  const [savingGamification, setSavingGamification] = useState(false);
  const { groups } = useGroups();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/admin/wiki", { replace: true });
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("organization_settings" as any)
        .select("*")
        .eq("singleton", true)
        .maybeSingle();

      if (error) {
        console.error("Failed to load org settings", error);
      } else if (data) {
        const row: any = data;
        setSettingsId(row.id);
        setName(row.name ?? "");
        setEmployeeCount(row.employee_count ?? "");
        setIndustry(row.industry ?? "Legal");
        setPhone(row.phone ?? "");
        setWebsite(row.website ?? "");
        setLogoUrl(row.logo_url ?? "");
        setLogoBgColor(row.logo_bg_color ?? "#ffffff");
        setAccentColor(row.accent_color ?? "#213C82");
        setGamificationEnabled(row.gamification_enabled ?? true);
        setStreakFrequency((row.streak_frequency ?? "weekly") as any);
        setExcludedGroups(row.gamification_excluded_groups ?? []);
      }
      setLoadingData(false);
    };
    load();
  }, []);

  const handleLogoUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("org-branding")
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("org-branding").getPublicUrl(path);
      setLogoUrl(pub.publicUrl);
      toast({ title: "Logo uploaded", description: "Don't forget to click Save." });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Upload failed",
        description: err.message || "Could not upload logo. Make sure the 'org-branding' storage bucket exists.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name,
        employee_count: employeeCount || null,
        industry,
        phone: phone || null,
        website: website || null,
        logo_url: logoUrl || null,
        logo_bg_color: logoBgColor,
        accent_color: accentColor,
        updated_by: (await supabase.auth.getUser()).data.user?.id,
      };
      const { error } = settingsId
        ? await supabase.from("organization_settings" as any).update(payload).eq("id", settingsId)
        : await supabase.from("organization_settings" as any).insert({ ...payload, singleton: true });
      if (error) throw error;
      toast({ title: "Settings saved", description: "Your changes have been saved." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Save failed", description: err.message || "Could not save settings.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGamification = async () => {
    setSavingGamification(true);
    try {
      const payload = {
        gamification_enabled: gamificationEnabled,
        streak_frequency: streakFrequency,
        gamification_excluded_groups: excludedGroups,
        updated_by: (await supabase.auth.getUser()).data.user?.id,
      };
      const { error } = settingsId
        ? await supabase.from("organization_settings" as any).update(payload).eq("id", settingsId)
        : await supabase.from("organization_settings" as any).insert({ ...payload, singleton: true });
      if (error) throw error;
      invalidateGamificationCache();
      toast({ title: "Gamification settings saved" });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSavingGamification(false);
    }
  };

  const toggleExcluded = (groupId: string) => {
    setExcludedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((g) => g !== groupId) : [...prev, groupId]
    );
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
              <div className="max-w-5xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>

                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0 gap-6">
                    <TabsTrigger
                      value="general"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3"
                    >
                      General
                    </TabsTrigger>
                    <TabsTrigger
                      value="content"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3"
                    >
                      Content
                    </TabsTrigger>
                    <TabsTrigger
                      value="people"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3"
                    >
                      People
                    </TabsTrigger>
                    <TabsTrigger
                      value="gamification"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3"
                    >
                      Gamification
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="mt-6">
                    <Card>
                      <CardContent className="pt-6 space-y-6">
                        {loadingData ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label htmlFor="org">Organization name</Label>
                                <Input id="org" value={name} onChange={(e) => setName(e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="emp">Number of employees</Label>
                                <Select value={employeeCount} onValueChange={setEmployeeCount}>
                                  <SelectTrigger id="emp">
                                    <SelectValue placeholder="Select range" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {EMPLOYEE_RANGES.map((r) => (
                                      <SelectItem key={r} value={r}>{r}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="industry">Industry</Label>
                                <Select value={industry} onValueChange={setIndustry}>
                                  <SelectTrigger id="industry">
                                    <SelectValue placeholder="Select industry" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {INDUSTRIES.map((i) => (
                                      <SelectItem key={i} value={i}>{i}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="phone">Phone number</Label>
                                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(000) 000-0000" />
                              </div>
                              <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="website">Website URL</Label>
                                <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
                              </div>
                            </div>

                            <div className="space-y-3">
                              <Label>Organization logo</Label>
                              <div className="flex items-end gap-4">
                                <div
                                  className="w-48 h-32 border border-border rounded-md flex items-center justify-center overflow-hidden"
                                  style={{ backgroundColor: logoBgColor }}
                                >
                                  {logoUrl ? (
                                    <img src={logoUrl} alt="Organization logo" className="max-w-full max-h-full object-contain" />
                                  ) : (
                                    <span className="text-xs text-muted-foreground">No logo</span>
                                  )}
                                </div>
                                <div className="flex flex-col gap-2">
                                  <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) handleLogoUpload(f);
                                      e.target.value = "";
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    variant="secondary"
                                  >
                                    {uploading ? (
                                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
                                    ) : (
                                      <><Upload className="h-4 w-4 mr-2" /> {logoUrl ? "Update logo" : "Upload logo"}</>
                                    )}
                                  </Button>
                                  {logoUrl && (
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setLogoUrl("")}>
                                      Remove
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label htmlFor="bg">Logo background color</Label>
                                <div className="flex items-center gap-2">
                                  <Input id="bg" value={logoBgColor} onChange={(e) => setLogoBgColor(e.target.value)} className="font-mono" />
                                  <input
                                    type="color"
                                    value={logoBgColor}
                                    onChange={(e) => setLogoBgColor(e.target.value)}
                                    className="h-10 w-10 rounded border border-border cursor-pointer"
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="accent">Accent color</Label>
                                <div className="flex items-center gap-2">
                                  <Input id="accent" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="font-mono" />
                                  <input
                                    type="color"
                                    value={accentColor}
                                    onChange={(e) => setAccentColor(e.target.value)}
                                    className="h-10 w-10 rounded border border-border cursor-pointer"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-border">
                              <Button onClick={handleSave} disabled={saving}>
                                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : "Save"}
                              </Button>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="content" className="mt-6">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Content settings coming soon.</p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="people" className="mt-6">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">People settings coming soon.</p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="gamification" className="mt-6">
                    <Card>
                      <CardContent className="pt-6 space-y-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <Switch
                                id="gam-enabled"
                                checked={gamificationEnabled}
                                onCheckedChange={setGamificationEnabled}
                              />
                              <Label htmlFor="gam-enabled" className="text-base font-semibold">
                                Enable gamification
                              </Label>
                            </div>
                            <p className="text-sm text-muted-foreground pl-12">
                              Toggle on to enable gamification features on your account, including training streaks and a leaderboard.
                            </p>
                          </div>
                        </div>

                        <div className={`space-y-4 border-t border-border pt-6 ${!gamificationEnabled ? "opacity-50 pointer-events-none" : ""}`}>
                          <div>
                            <h3 className="text-base font-semibold text-foreground">Completion streaks</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Encourage users to get to 100% completion every week, month, or quarter. Keeping a streak helps them move up the leaderboard. People in your exception list won't have the streaks or leaderboard experience.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>Streak frequency</Label>
                            <div className="flex gap-6">
                              {(["weekly", "monthly", "quarterly"] as const).map((freq) => (
                                <label key={freq} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="streak-frequency"
                                    value={freq}
                                    checked={streakFrequency === freq}
                                    onChange={() => setStreakFrequency(freq)}
                                    className="accent-primary"
                                  />
                                  <span className="text-sm capitalize">{freq}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Exceptions</Label>
                            <p className="text-xs text-muted-foreground">
                              Select groups to exclude from streaks and the leaderboard.
                            </p>
                            {groups.length === 0 ? (
                              <p className="text-sm text-muted-foreground italic">
                                No groups exist yet. Create groups on the Groups page to use them here.
                              </p>
                            ) : (
                              <div className="border border-border rounded-md max-h-64 overflow-auto">
                                {groups.map((g) => {
                                  const checked = excludedGroups.includes(g.id);
                                  return (
                                    <label
                                      key={g.id}
                                      className="flex items-center justify-between gap-3 p-3 border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer"
                                    >
                                      <div className="flex items-center gap-3">
                                        <Checkbox
                                          checked={checked}
                                          onCheckedChange={() => toggleExcluded(g.id)}
                                        />
                                        <div>
                                          <div className="text-sm font-medium">{g.name}</div>
                                          <div className="text-xs text-muted-foreground">
                                            {g.type} · {g.member_count ?? 0} {g.member_count === 1 ? "member" : "members"}
                                          </div>
                                        </div>
                                      </div>
                                      {checked && <Check className="h-4 w-4 text-primary" />}
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                            {excludedGroups.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {excludedGroups.length} {excludedGroups.length === 1 ? "group" : "groups"} excluded
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-border">
                          <Button onClick={handleSaveGamification} disabled={savingGamification}>
                            {savingGamification ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : "Save"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default AdminWikiSettingsPage;
