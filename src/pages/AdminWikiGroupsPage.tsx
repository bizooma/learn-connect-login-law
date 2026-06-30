import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminDashboardHeader from "@/components/admin/AdminDashboardHeader";
import WikiSidebar from "@/components/admin/wiki/WikiSidebar";
import { useWikiCategories } from "@/hooks/useWikiCategories";
import { useUserRole } from "@/hooks/useUserRole";
import { useGroups, useGroupMembers, Group, GroupType } from "@/hooks/useGroups";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from "@/components/ui/table";
import { ResizableHead } from "@/components/admin/wiki/ResizableHead";
import { useResizableColumns } from "@/hooks/useResizableColumns";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MoreVertical, Plus, Search, Trash2, UserPlus, Users, X, Loader2 } from "lucide-react";

const TYPES: GroupType[] = ["Role", "Department", "Team", "Custom"];

interface FormState {
  name: string;
  type: GroupType;
  description: string;
  manager_ids: string[];
}

const EMPTY_FORM: FormState = { name: "", type: "Custom", description: "", manager_ids: [] };

const AdminWikiGroupsPage = () => {
  const navigate = useNavigate();
  const { categories } = useWikiCategories();
  const { isAdmin } = useUserRole();
  const { groups, loading, createGroup, updateGroup, deleteGroup, setGroupManagers, fetchGroups } = useGroups();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const cols = useResizableColumns({
    storageKey: "groups-cols",
    defaults: [240, 220, 120, 140, 400, 60],
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);
  const [membersTarget, setMembersTarget] = useState<Group | null>(null);

  const [profileOptions, setProfileOptions] = useState<{ id: string; label: string }[]>([]);

  const loadProfiles = async () => {
    if (profileOptions.length > 0) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .eq("is_deleted", false)
      .order("first_name");
    setProfileOptions(
      (data ?? []).map((p: any) => ({
        id: p.id,
        label: [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email,
      }))
    );
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.type.toLowerCase().includes(q) ||
        (g.description ?? "").toLowerCase().includes(q)
    );
  }, [groups, search]);

  const openCreate = async () => {
    await loadProfiles();
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = async (g: Group) => {
    await loadProfiles();
    setEditing(g);
    setForm({
      name: g.name,
      type: g.type,
      description: g.description ?? "",
      manager_ids: g.manager_ids ?? [],
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        description: form.description.trim(),
        manager_id: form.manager_ids[0] || null,
      };
      let groupId: string | undefined;
      if (editing) {
        await updateGroup(editing.id, payload);
        groupId = editing.id;
        toast({ title: "Group updated" });
      } else {
        const created: any = await createGroup(payload);
        // createGroup currently returns void; refetch and find by name as fallback
        groupId = created?.id;
        toast({ title: "Group created" });
      }
      if (groupId) {
        await setGroupManagers(groupId, form.manager_ids);
      } else {
        // fallback: refetch then locate
        await fetchGroups();
        const found = (groups || []).find((g) => g.name === payload.name);
        if (found) await setGroupManagers(found.id, form.manager_ids);
      }
      setFormOpen(false);
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteGroup(deleteTarget.id);
      toast({ title: "Group deleted" });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    } finally {
      setDeleteTarget(null);
    }
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
            onCategorySelect={(id) =>
              navigate("/admin/wiki", { state: { activeCategoryId: id } })
            }
          />

          <div className="flex-1 flex flex-col min-w-0">
            <div className="border-b border-border px-6 py-3 flex items-center gap-3" style={{ backgroundColor: "#FFDA00" }}>
              <SidebarTrigger />
              <div>
                <h2 className="text-lg font-semibold text-foreground">Groups</h2>
                <p className="text-xs text-muted-foreground">
                  {filtered.length} {filtered.length === 1 ? "group" : "groups"}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="w-full px-2 space-y-4">
                <div className="rounded-lg border border-border bg-background p-5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#213C82]">
                      Keep your account organized with groups
                    </h3>
                    <p className="text-sm text-[#213C82]/80 mt-1">
                      Bulk-share content and gate features by role, department, team and more.
                    </p>
                  </div>
                  <Users className="h-10 w-10 text-[#213C82] shrink-0" />
                </div>


                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search groups..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {isAdmin && (
                    <Button onClick={openCreate}>
                      <Plus className="h-4 w-4 mr-2" /> Add group
                    </Button>
                  )}
                </div>

                <div className="rounded-lg border border-border bg-card">
                  <Table className="table-fixed w-full">
                    <TableHeader>
                      <TableRow>
                        <ResizableHead width={cols.widths[0]} onResize={cols.onMouseDown(0)}>Name</ResizableHead>
                        <ResizableHead width={cols.widths[1]} onResize={cols.onMouseDown(1)}>Manager</ResizableHead>
                        <ResizableHead width={cols.widths[2]} onResize={cols.onMouseDown(2)}>Members</ResizableHead>
                        <ResizableHead width={cols.widths[3]} onResize={cols.onMouseDown(3)}>Type</ResizableHead>
                        <ResizableHead width={cols.widths[4]} onResize={cols.onMouseDown(4)}>Description</ResizableHead>
                        <ResizableHead width={cols.widths[5]} />

                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading groups...
                          </TableCell>
                        </TableRow>
                      ) : filtered.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No groups yet. {isAdmin && "Click \"Add group\" to create one."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filtered.map((g) => (
                          <TableRow key={g.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium text-foreground">{g.name}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {g.manager_names && g.manager_names.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {g.manager_names.map((n, i) => (
                                    <Badge key={i} variant="outline" className="font-normal">{n}</Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="italic">None</span>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{g.member_count ?? 0}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{g.type}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-xs truncate">
                              {g.description || <span className="italic">—</span>}
                            </TableCell>
                            <TableCell>
                              {isAdmin && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setMembersTarget(g)}>
                                      <UserPlus className="h-4 w-4 mr-2" /> Manage members
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openEdit(g)}>
                                      Edit group
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => setDeleteTarget(g)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" /> Delete group
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>

      {/* Create / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit group" : "Create group"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update group details." : "Add a new group to organize people."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="g-name">Name</Label>
              <Input
                id="g-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Paralegal Team"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="g-type">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as GroupType })}>
                <SelectTrigger id="g-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Managers (optional, multiple)</Label>
              {form.manager_ids.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {form.manager_ids.map((id) => {
                    const p = profileOptions.find((o) => o.id === id);
                    return (
                      <Badge key={id} variant="secondary" className="gap-1">
                        {p?.label ?? "Unknown"}
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              manager_ids: form.manager_ids.filter((x) => x !== id),
                            })
                          }
                          className="ml-1 hover:text-destructive"
                          aria-label="Remove manager"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
              <Select
                value=""
                onValueChange={(v) => {
                  if (!form.manager_ids.includes(v)) {
                    setForm({ ...form, manager_ids: [...form.manager_ids, v] });
                  }
                }}
              >
                <SelectTrigger><SelectValue placeholder="Add a manager…" /></SelectTrigger>
                <SelectContent>
                  {profileOptions
                    .filter((p) => !form.manager_ids.includes(p.id))
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="g-desc">Description (optional)</Label>
              <Textarea
                id="g-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving</> : (editing ? "Save changes" : "Create group")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this group?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" and all its memberships will be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manage members */}
      <ManageMembersDialog
        group={membersTarget}
        onClose={() => {
          setMembersTarget(null);
          fetchGroups();
        }}
      />
    </div>
  );
};

const ManageMembersDialog = ({ group, onClose }: { group: Group | null; onClose: () => void }) => {
  const { members, addMember, removeMember, loading } = useGroupMembers(group?.id ?? null);
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [allUsers, setAllUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [adding, setAdding] = useState<string | null>(null);

  const open = !!group;

  // Load full user list once when dialog opens
  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .eq("is_deleted", false)
        .order("first_name");
      setAllUsers(
        (data ?? []).map((p: any) => ({
          id: p.id,
          name: [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email,
          email: p.email,
        }))
      );
    })();
  }, [open]);

  const memberIds = new Set(members.map((m) => m.user_id));
  const filteredCandidates = allUsers
    .filter((u) => !memberIds.has(u.id))
    .filter((u) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    })
    .slice(0, 50);

  const handleAdd = async (id: string) => {
    setAdding(id);
    try {
      await addMember(id);
    } catch (err: any) {
      toast({ title: "Failed to add", description: err.message, variant: "destructive" });
    } finally {
      setAdding(null);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeMember(id);
    } catch (err: any) {
      toast({ title: "Failed to remove", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage members — {group?.name}</DialogTitle>
          <DialogDescription>Add or remove people from this group.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-auto">
          <div>
            <h4 className="text-sm font-medium mb-2">
              Current members ({members.length})
            </h4>
            {loading ? (
              <p className="text-sm text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin inline mr-2" />Loading...</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No members yet.</p>
            ) : (
              <div className="space-y-1">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded border border-border">
                    <div className="text-sm">
                      <div className="font-medium">{[m.first_name, m.last_name].filter(Boolean).join(" ") || m.email}</div>
                      <div className="text-xs text-muted-foreground">{m.email}</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRemove(m.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Add members</h4>
            <Input
              placeholder="Search people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-2"
            />
            <div className="space-y-1">
              {filteredCandidates.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No matching people.</p>
              ) : (
                filteredCandidates.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-2 rounded border border-border">
                    <div className="text-sm">
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAdd(u.id)}
                      disabled={adding === u.id}
                    >
                      {adding === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
                      Add
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminWikiGroupsPage;
