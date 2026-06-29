import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useGroups } from "@/hooks/useGroups";
import { toast } from "sonner";
import { ChevronDown, Loader2, X, Search } from "lucide-react";
import { UserProfile } from "./types";
import { updateUserRoleSafe, softDeleteUserSafe } from "./updatedUserManagementService";
import { exportUsersCsv, ExportableUser } from "@/lib/exportUsersCsv";
import { EnrichedUserMeta } from "./userRoleUtils";

interface BulkActionsBarProps {
  selectedIds: string[];
  users: UserProfile[];
  metaById: Record<string, EnrichedUserMeta>;
  groupNameById: Record<string, string>;
  onClear: () => void;
  onRefresh: () => void;
  // When nothing is selected, "Export" exports the currently filtered set instead
  filteredUsers: UserProfile[];
}

type GroupMode = "add" | "remove";

const BulkActionsBar = ({
  selectedIds,
  users,
  metaById,
  groupNameById,
  onClear,
  onRefresh,
  filteredUsers,
}: BulkActionsBarProps) => {
  const { groups } = useGroups();
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupMode, setGroupMode] = useState<GroupMode>("add");
  const [groupPick, setGroupPick] = useState<Record<string, boolean>>({});
  const [groupQuery, setGroupQuery] = useState("");
  const [running, setRunning] = useState(false);

  const selectedUsers = users.filter((u) => selectedIds.includes(u.id));

  const openGroupDialog = (mode: GroupMode) => {
    setGroupMode(mode);
    setGroupPick({});
    setGroupQuery("");
    setGroupDialogOpen(true);
  };

  const runBulk = async <T,>(
    fn: (user: UserProfile) => Promise<T>,
    label: string
  ) => {
    setRunning(true);
    let ok = 0;
    let fail = 0;
    for (const u of selectedUsers) {
      try {
        await fn(u);
        ok++;
      } catch (err) {
        console.error("bulk error", u.email, err);
        fail++;
      }
    }
    setRunning(false);
    onRefresh();
    toast[fail === 0 ? "success" : "error"](
      `${label}: ${ok} succeeded${fail ? `, ${fail} failed` : ""}`
    );
    if (fail === 0) onClear();
  };

  const applyGroups = async () => {
    const ids = Object.entries(groupPick)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (ids.length === 0) {
      toast.error("Pick at least one group");
      return;
    }
    setGroupDialogOpen(false);
    const { data: u } = await supabase.auth.getUser();
    await runBulk(async (user) => {
      if (groupMode === "add") {
        const rows = ids.map((group_id) => ({
          group_id,
          user_id: user.id,
          added_by: u.user?.id ?? null,
        }));
        const { error } = await supabase
          .from("group_members" as any)
          .upsert(rows, { onConflict: "group_id,user_id", ignoreDuplicates: true });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("group_members" as any)
          .delete()
          .eq("user_id", user.id)
          .in("group_id", ids);
        if (error) throw error;
      }
    }, groupMode === "add" ? "Added to groups" : "Removed from groups");
  };

  const setRole = async (role: string) => {
    await runBulk(
      (user) => updateUserRoleSafe(user.id, role as any, "Bulk role change"),
      `Set role to ${role}`
    );
  };

  const toggleTester = async (next: boolean) => {
    await runBulk(async (user) => {
      if (next) {
        const { error } = await supabase
          .from("user_roles")
          .upsert(
            { user_id: user.id, role: "tester" as any },
            { onConflict: "user_id,role", ignoreDuplicates: true }
          );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", user.id)
          .eq("role", "tester" as any);
        if (error) throw error;
      }
    }, next ? "Granted Tester access" : "Removed Tester access");
  };

  const deactivate = async () => {
    if (!confirm(`Deactivate ${selectedIds.length} user(s)?`)) return;
    await runBulk(async (user) => {
      await softDeleteUserSafe(user.id, "Bulk deactivation");
    }, "Deactivated");
  };

  const exportCsv = () => {
    const source = selectedIds.length > 0 ? selectedUsers : filteredUsers;
    const enriched: ExportableUser[] = source.map((u) => ({
      ...u,
      lastLoginAt: metaById[u.id]?.lastLoginAt || null,
      groupNames: (metaById[u.id]?.groupIds || []).map((id) => groupNameById[id] || id),
      isTester: !!metaById[u.id]?.isTester,
    }));
    exportUsersCsv(enriched, `users-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success(`Exported ${enriched.length} user(s)`);
  };

  const noSelection = selectedIds.length === 0;
  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(groupQuery.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 p-3 border border-border rounded-lg bg-background sticky top-0 z-20 shadow-sm">
        <div className="text-sm font-medium">
          {noSelection ? (
            <span className="text-muted-foreground">No users selected</span>
          ) : (
            <>
              <span className="text-primary font-bold">{selectedIds.length}</span> selected
            </>
          )}
        </div>

        <div className="h-5 w-px bg-border mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" disabled={noSelection || running}>
              Groups <ChevronDown className="h-3.5 w-3.5 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => openGroupDialog("add")}>
              Add to group(s)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openGroupDialog("remove")}>
              Remove from group(s)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" disabled={noSelection || running}>
              Change role <ChevronDown className="h-3.5 w-3.5 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {["admin", "owner", "team_leader", "student", "client", "free"].map((r) => (
              <DropdownMenuItem key={r} onClick={() => setRole(r)}>
                {r.replace("_", " ")}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" disabled={noSelection || running}>
              Tester <ChevronDown className="h-3.5 w-3.5 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => toggleTester(true)}>
              Grant Tester access
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleTester(false)}>
              Remove Tester access
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:text-destructive"
          disabled={noSelection || running}
          onClick={deactivate}
        >
          Deactivate
        </Button>

        <div className="h-5 w-px bg-border mx-1" />

        <Button size="sm" variant="outline" onClick={exportCsv}>
          Export CSV {noSelection && `(${filteredUsers.length} filtered)`}
        </Button>

        {running && (
          <span className="inline-flex items-center text-xs text-muted-foreground gap-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Working…
          </span>
        )}

        {!noSelection && (
          <Button size="sm" variant="ghost" onClick={onClear} className="ml-auto">
            <X className="h-3.5 w-3.5 mr-1" /> Clear selection
          </Button>
        )}
      </div>

      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {groupMode === "add" ? "Add to groups" : "Remove from groups"}
            </DialogTitle>
            <DialogDescription>
              Select groups to {groupMode === "add" ? "add" : "remove"} for{" "}
              {selectedIds.length} user(s).
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={groupQuery}
              onChange={(e) => setGroupQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <ScrollArea className="h-72 rounded-md border">
            <div className="divide-y">
              {filteredGroups.map((g) => (
                <label
                  key={g.id}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 cursor-pointer"
                >
                  <Checkbox
                    checked={!!groupPick[g.id]}
                    onCheckedChange={(v) =>
                      setGroupPick((s) => ({ ...s, [g.id]: !!v }))
                    }
                  />
                  <div className="text-sm">{g.name}</div>
                </label>
              ))}
              {filteredGroups.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No groups found.
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyGroups}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BulkActionsBar;
