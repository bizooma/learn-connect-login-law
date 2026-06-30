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

  // Content tab
  const [publicShareEnabled, setPublicShareEnabled] = useState(true);
  const [pdfDownloadsEnabled, setPdfDownloadsEnabled] = useState(true);
  const [esignaturePermission, setEsignaturePermission] = useState("billing_admin");
  const [feedbackEnabled, setFeedbackEnabled] = useState(true);
  const [defaultDiscoverability, setDefaultDiscoverability] = useState<"discoverable" | "request" | "private">("discoverable");
  const [savingContent, setSavingContent] = useState(false);

  // People tab
  const [directoryEnabled, setDirectoryEnabled] = useState(true);
  const [directoryRestricted, setDirectoryRestricted] = useState<string[]>([]);
  const [peopleChartEnabled, setPeopleChartEnabled] = useState(true);
  const [peopleChartRestricted, setPeopleChartRestricted] = useState<string[]>([]);
  const [roleChartEnabled, setRoleChartEnabled] = useState(true);
  const [roleChartRestricted, setRoleChartRestricted] = useState<string[]>([]);
  const [shareReportsDirectReports, setShareReportsDirectReports] = useState(true);
  const [savingPeople, setSavingPeople] = useState(false);



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
        setPublicShareEnabled(row.content_public_share_enabled ?? true);
        setPdfDownloadsEnabled(row.content_pdf_downloads_enabled ?? true);
        setEsignaturePermission(row.content_esignature_permission ?? "billing_admin");
        setFeedbackEnabled(row.content_feedback_enabled ?? true);
        setDefaultDiscoverability((row.content_default_discoverability ?? "discoverable") as any);
        setDirectoryEnabled(row.people_directory_enabled ?? true);
        setDirectoryRestricted(row.people_directory_restricted_groups ?? []);
        setPeopleChartEnabled(row.people_chart_enabled ?? true);
        setPeopleChartRestricted(row.people_chart_restricted_groups ?? []);
        setRoleChartEnabled(row.people_role_chart_enabled ?? true);
        setRoleChartRestricted(row.people_role_chart_restricted_groups ?? []);
        setShareReportsDirectReports(row.people_share_reports_direct_reports ?? true);
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

  const handleSaveContent = async () => {
    setSavingContent(true);
    try {
      const payload = {
        content_public_share_enabled: publicShareEnabled,
        content_pdf_downloads_enabled: pdfDownloadsEnabled,
        content_esignature_permission: esignaturePermission,
        content_feedback_enabled: feedbackEnabled,
        content_default_discoverability: defaultDiscoverability,
        updated_by: (await supabase.auth.getUser()).data.user?.id,
      };
      const { error } = settingsId
        ? await supabase.from("organization_settings" as any).update(payload).eq("id", settingsId)
        : await supabase.from("organization_settings" as any).insert({ ...payload, singleton: true });
      if (error) throw error;
      toast({ title: "Content settings saved" });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSavingContent(false);
    }
  };

  const handleSavePeople = async () => {
    setSavingPeople(true);
    try {
      const payload = {
        people_directory_enabled: directoryEnabled,
        people_directory_restricted_groups: directoryRestricted,
        people_chart_enabled: peopleChartEnabled,
        people_chart_restricted_groups: peopleChartRestricted,
        people_role_chart_enabled: roleChartEnabled,
        people_role_chart_restricted_groups: roleChartRestricted,
        people_share_reports_direct_reports: shareReportsDirectReports,
        updated_by: (await supabase.auth.getUser()).data.user?.id,
      };
      const { error } = settingsId
        ? await supabase.from("organization_settings" as any).update(payload).eq("id", settingsId)
        : await supabase.from("organization_settings" as any).insert({ ...payload, singleton: true });
      if (error) throw error;
      toast({ title: "People settings saved" });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSavingPeople(false);
    }
  };

  const toggleInList = (
    list: string[],
    setter: (v: string[]) => void,
    id: string,
  ) => {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
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
            <div className="border-b border-border px-6 py-3 flex items-center gap-3" style={{ backgroundColor: "#FFDA00" }}>
              <SidebarTrigger />
              <div>
                <h2 className="text-lg font-semibold text-foreground">Settings</h2>
                <p className="text-xs text-muted-foreground">Manage organization settings</p>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="w-full px-2 space-y-6">
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
                      <CardContent className="pt-6 space-y-8">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Creating and sharing content</h3>

                          <div className="space-y-6">
                            <div className="flex items-start gap-4">
                              <Switch checked={publicShareEnabled} onCheckedChange={setPublicShareEnabled} />
                              <div className="flex-1">
                                <Label className="text-base font-semibold">Enable "Public share" feature</Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Public share allows users to share your content/training outside of the platform.
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-4">
                              <Switch checked={pdfDownloadsEnabled} onCheckedChange={setPdfDownloadsEnabled} />
                              <div className="flex-1">
                                <Label className="text-base font-semibold">Enable PDF downloads</Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Allow admins to download PDFs of your content.
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-border">
                              <Label className="text-base font-semibold">Select who can add e-signatures to content</Label>
                              <p className="text-sm text-muted-foreground">
                                Select which permission you would like to allow to require legally binding e-signatures to content.
                              </p>
                              <Select value={esignaturePermission} onValueChange={setEsignaturePermission}>
                                <SelectTrigger className="max-w-md">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="billing_admin">Billing Admin</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="manager">Manager</SelectItem>
                                  <SelectItem value="everyone">Everyone</SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">
                                By default, the Billing admin will always be able to add an e-signature.
                              </p>
                            </div>

                            <div className="flex items-start gap-4 pt-2 border-t border-border">
                              <Switch checked={feedbackEnabled} onCheckedChange={setFeedbackEnabled} />
                              <div className="flex-1">
                                <Label className="text-base font-semibold">Allow all users to give content feedback (recommended)</Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Let anyone flag issues or suggest improvements on training. Turning this off disables feedback across all content.
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-border">
                              <Label className="text-base font-semibold">Content discoverability</Label>
                              <p className="text-sm text-muted-foreground">
                                Set your default access settings for all newly created content. Content creators and admins will be able to override this on a subject-by-subject basis.
                              </p>
                              <Select
                                value={defaultDiscoverability}
                                onValueChange={(v) => setDefaultDiscoverability(v as any)}
                              >
                                <SelectTrigger className="max-w-md">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="discoverable">Discoverable</SelectItem>
                                  <SelectItem value="request">Request</SelectItem>
                                  <SelectItem value="private">Private</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-border">
                          <Button onClick={handleSaveContent} disabled={savingContent}>
                            {savingContent ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : "Save"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>


                  <TabsContent value="people" className="mt-6">
                    <Card>
                      <CardContent className="pt-6 space-y-8">
                        {[
                          {
                            key: "directory",
                            title: 'Share the "Directory" with your entire team',
                            description:
                              "Help your team feel more connected by letting them see each other's profiles. Only admins and Billing admins will have access to administrative functions, content management, and reports.",
                            restrictLabel: "Restrict groups from accessing directory",
                            restrictHelp: "Admins and Billing admins will have access to the directory, no matter their group.",
                            enabled: directoryEnabled,
                            setEnabled: setDirectoryEnabled,
                            restricted: directoryRestricted,
                            setRestricted: setDirectoryRestricted,
                          },
                          {
                            key: "people-chart",
                            title: 'Share the "People chart" with your entire team',
                            description:
                              'Give all team members access to your "People chart" regardless of permission level. Only admins can edit the chart.',
                            restrictLabel: "Restrict groups from accessing people chart",
                            restrictHelp: "Admins and Billing admins will have access to the people chart, no matter their group.",
                            enabled: peopleChartEnabled,
                            setEnabled: setPeopleChartEnabled,
                            restricted: peopleChartRestricted,
                            setRestricted: setPeopleChartRestricted,
                          },
                          {
                            key: "role-chart",
                            title: 'Share the "Role chart" with your entire team',
                            description:
                              'Give all team members access to your "Role chart" regardless of permission level. Only admins can edit the chart.',
                            restrictLabel: "Restrict groups from accessing role chart",
                            restrictHelp: "Admins and Billing admins will have access to the role chart, no matter their group.",
                            enabled: roleChartEnabled,
                            setEnabled: setRoleChartEnabled,
                            restricted: roleChartRestricted,
                            setRestricted: setRoleChartRestricted,
                          },
                        ].map((row) => (
                          <div key={row.key} className="space-y-3 pb-6 border-b border-border last:border-0">
                            <div className="flex items-start gap-4">
                              <Switch checked={row.enabled} onCheckedChange={row.setEnabled} />
                              <div className="flex-1">
                                <Label className="text-base font-semibold">{row.title}</Label>
                                <p className="text-sm text-muted-foreground mt-1">{row.description}</p>
                              </div>
                            </div>
                            {row.enabled && (
                              <div className="pl-14 space-y-2">
                                <Label className="text-sm font-semibold">{row.restrictLabel}</Label>
                                {groups.length === 0 ? (
                                  <p className="text-sm text-muted-foreground italic">
                                    No groups exist yet. Create groups on the Groups page to use them here.
                                  </p>
                                ) : (
                                  <div className="border border-border rounded-md max-h-48 overflow-auto max-w-md">
                                    {groups.map((g) => {
                                      const checked = row.restricted.includes(g.id);
                                      return (
                                        <label
                                          key={g.id}
                                          className="flex items-center justify-between gap-3 p-2 border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer"
                                        >
                                          <div className="flex items-center gap-3">
                                            <Checkbox
                                              checked={checked}
                                              onCheckedChange={() => toggleInList(row.restricted, row.setRestricted, g.id)}
                                            />
                                            <div className="text-sm">{g.name}</div>
                                          </div>
                                          {checked && <Check className="h-4 w-4 text-primary" />}
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}
                                <p className="text-xs text-muted-foreground">{row.restrictHelp}</p>
                              </div>
                            )}
                          </div>
                        ))}

                        <div className="flex items-start gap-4">
                          <Switch
                            checked={shareReportsDirectReports}
                            onCheckedChange={setShareReportsDirectReports}
                          />
                          <div className="flex-1">
                            <Label className="text-base font-semibold">Share reports with users who have direct reports</Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Give all users with direct reports access to the Content report, People report, Latest activity report, and Manage users table. Non-admin users will only be able to view or edit data for those who directly report to them.
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-border">
                          <Button onClick={handleSavePeople} disabled={savingPeople}>
                            {savingPeople ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : "Save"}
                          </Button>
                        </div>
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

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start bg-muted/30 border border-border rounded-lg p-5">
                            <div className="space-y-2">
                              <Label>Streak frequency</Label>
                              <div className="flex flex-col gap-2">
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

                            {/* Live streak preview */}
                            {(() => {
                              const unit = streakFrequency === "weekly" ? "week" : streakFrequency === "monthly" ? "month" : "quarter";
                              const count = 11;
                              const labels = (() => {
                                const now = new Date();
                                const out: { label: string; done: boolean }[] = [];
                                for (let i = 4; i >= 0; i--) {
                                  const d = new Date(now);
                                  if (streakFrequency === "weekly") d.setDate(d.getDate() - i * 7);
                                  else if (streakFrequency === "monthly") d.setMonth(d.getMonth() - i);
                                  else d.setMonth(d.getMonth() - i * 3);
                                  out.push({
                                    label: d.toLocaleDateString("en-US", { month: "short", day: streakFrequency === "weekly" ? "numeric" : undefined }),
                                    done: i >= 1,
                                  });
                                }
                                return out;
                              })();
                              return (
                                <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                                  <div className="flex items-start gap-3">
                                    <div className="text-3xl leading-none">🔥</div>
                                    <div className="flex-1">
                                      <div className="font-semibold text-foreground">{count} {unit} streak</div>
                                      <div className="text-xs text-muted-foreground mt-0.5">
                                        Great work—you hit 100% completion {count} {unit}s in a row!
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-4 flex items-end justify-between gap-2">
                                    {labels.map((l, i) => (
                                      <div key={i} className="flex flex-col items-center gap-1 flex-1">
                                        <div className="text-[10px] text-muted-foreground">{l.label}</div>
                                        <div
                                          className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                            l.done ? "bg-emerald-400 text-white" : "bg-muted text-muted-foreground"
                                          }`}
                                        >
                                          {l.done ? "✓" : ""}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
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
