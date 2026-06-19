import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useGroups } from "@/hooks/useGroups";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search } from "lucide-react";

interface UserGroupsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

const UserGroupsDialog = ({ open, onOpenChange, userId, userName }: UserGroupsDialogProps) => {
  const { groups, loading: groupsLoading } = useGroups();
  const { toast } = useToast();
  const [memberRows, setMemberRows] = useState<{ id: string; group_id: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const fetchMemberships = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("group_members" as any)
        .select("id, group_id")
        .eq("user_id", userId);
      if (error) throw error;
      setMemberRows(((data ?? []) as any[]).map((r) => ({ id: r.id, group_id: r.group_id })));
    } catch (err: any) {
      toast({ title: "Failed to load groups", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchMemberships();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  const toggle = async (groupId: string, isMember: boolean, memberRowId?: string) => {
    setSaving(groupId);
    try {
      if (isMember && memberRowId) {
        const { error } = await supabase.from("group_members" as any).delete().eq("id", memberRowId);
        if (error) throw error;
      } else if (!isMember) {
        const userRes = await supabase.auth.getUser();
        const { error } = await supabase
          .from("group_members" as any)
          .insert({ group_id: groupId, user_id: userId, added_by: userRes.data.user?.id ?? null });
        if (error) throw error;
      }
      await fetchMemberships();
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const filtered = groups.filter((g) => g.name.toLowerCase().includes(query.toLowerCase()));
  const memberCount = memberRows.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Groups</DialogTitle>
          <DialogDescription>
            {userName} — currently in <Badge variant="secondary">{memberCount}</Badge> group{memberCount === 1 ? "" : "s"}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <ScrollArea className="h-80 rounded-md border">
          {loading || groupsLoading ? (
            <div className="flex items-center justify-center h-full p-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No groups found.</div>
          ) : (
            <div className="divide-y">
              {filtered.map((g) => {
                const row = memberRows.find((m) => m.group_id === g.id);
                const isMember = !!row;
                const isSaving = saving === g.id;
                return (
                  <label
                    key={g.id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 cursor-pointer"
                  >
                    <Checkbox
                      checked={isMember}
                      disabled={isSaving}
                      onCheckedChange={() => toggle(g.id, isMember, row?.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{g.name}</div>
                      {g.description && (
                        <div className="text-xs text-muted-foreground truncate">{g.description}</div>
                      )}
                    </div>
                    {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                  </label>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserGroupsDialog;
