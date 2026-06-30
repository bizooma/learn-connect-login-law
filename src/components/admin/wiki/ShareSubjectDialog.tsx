import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Search, X, Globe, Link2, Users, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  WikiCategory,
  WikiAccessLevel,
  WikiDiscoverability,
  WikiSharedGroup,
  WikiSharedUser,
  useWikiCategories,
} from "@/hooks/useWikiCategories";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: WikiCategory;
}

const accessLabel: Record<WikiAccessLevel, string> = {
  view: "View",
  edit: "Edit",
  full: "Full",
};

const ShareSubjectDialog = ({ open, onOpenChange, category }: Props) => {
  const qc = useQueryClient();
  const { updateCategory } = useWikiCategories();
  const [shares, setShares] = useState<WikiSharedGroup[]>([]);
  const [userShares, setUserShares] = useState<WikiSharedUser[]>([]);
  const [discoverability, setDiscoverability] = useState<WikiDiscoverability>(
    category.discoverability,
  );
  const [publicShare, setPublicShare] = useState<boolean>(category.public_share_enabled);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset local state every time dialog opens
  useEffect(() => {
    if (open) {
      setShares(category.shared_groups || []);
      setUserShares(category.shared_users || []);
      setDiscoverability(category.discoverability);
      setPublicShare(category.public_share_enabled);
    }
  }, [open, category]);

  const { data: allGroups = [] } = useQuery({
    queryKey: ["all-groups-for-share-dialog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("groups")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
    enabled: open,
  });

  const selectedIds = useMemo(() => new Set(shares.map((s) => s.id)), [shares]);
  const availableGroups = allGroups.filter((g) => !selectedIds.has(g.id));

  const ownerName =
    [category.owner?.first_name, category.owner?.last_name]
      .filter(Boolean)
      .join(" ") || category.owner?.email || "Owner";

  const addGroup = (g: { id: string; name: string }) => {
    setShares((prev) => [
      ...prev,
      { id: g.id, name: g.name, access_level: "view", completion_required: false },
    ]);
    setAddOpen(false);
  };

  const removeGroup = (id: string) => {
    setShares((prev) => prev.filter((s) => s.id !== id));
  };

  const updateShare = (id: string, patch: Partial<WikiSharedGroup>) => {
    setShares((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save subject-level fields
      if (
        discoverability !== category.discoverability ||
        publicShare !== category.public_share_enabled
      ) {
        await updateCategory.mutateAsync({
          id: category.id,
          discoverability,
          public_share_enabled: publicShare,
        });
      }

      // Diff group shares
      const original = category.shared_groups || [];
      const origMap = new Map(original.map((o) => [o.id, o]));
      const newMap = new Map(shares.map((s) => [s.id, s]));

      const toDelete = original.filter((o) => !newMap.has(o.id));
      const toInsert = shares.filter((s) => !origMap.has(s.id));
      const toUpdate = shares.filter((s) => {
        const o = origMap.get(s.id);
        return (
          o &&
          (o.access_level !== s.access_level ||
            o.completion_required !== s.completion_required)
        );
      });

      if (toDelete.length > 0) {
        const { error } = await supabase
          .from("wiki_category_groups")
          .delete()
          .eq("category_id", category.id)
          .in(
            "group_id",
            toDelete.map((d) => d.id),
          );
        if (error) throw error;
      }

      if (toInsert.length > 0) {
        const { error } = await supabase.from("wiki_category_groups").insert(
          toInsert.map((s) => ({
            category_id: category.id,
            group_id: s.id,
            access_level: s.access_level,
            completion_required: s.completion_required,
          })) as any,
        );
        if (error) throw error;
      }

      for (const s of toUpdate) {
        const { error } = await supabase
          .from("wiki_category_groups")
          .update({
            access_level: s.access_level,
            completion_required: s.completion_required,
          } as any)
          .eq("category_id", category.id)
          .eq("group_id", s.id);
        if (error) throw error;
      }

      qc.invalidateQueries({ queryKey: ["wiki-categories"] });
      toast.success("Sharing updated");
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Failed to save sharing: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const copyPublicLink = async () => {
    const url = `${window.location.origin}/wiki/public/${category.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Public link copied");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <DialogTitle className="text-xl">Share {category.title}</DialogTitle>
            <Badge variant={category.is_published ? "default" : "secondary"}>
              {category.is_published ? "Published" : "Draft"}
            </Badge>
          </div>
          <DialogDescription>
            People and groups with edit access can collaborate before publishing. Publish to
            allow viewing and assignment.
          </DialogDescription>
        </DialogHeader>

        {/* Add picker */}
        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 w-full rounded-md border border-input bg-background px-3 py-2 text-left text-sm hover:bg-muted/40"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground flex-1">Search people and groups</span>
              <Plus className="h-4 w-4 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search groups…" />
              <CommandList>
                <CommandEmpty>No groups found.</CommandEmpty>
                <CommandGroup>
                  {availableGroups.map((g) => (
                    <CommandItem
                      key={g.id}
                      onSelect={() => addGroup(g)}
                      className="cursor-pointer"
                    >
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      {g.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Shared with list */}
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-1 text-xs font-medium text-muted-foreground">
            <span>Shared with:</span>
            <span className="w-24 text-center">Completion</span>
            <span className="w-24 text-center">Access</span>
            <span className="w-6" />
          </div>

          {/* Owner row */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-1">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-8 w-8">
                {category.owner?.profile_image_url && (
                  <AvatarImage src={category.owner.profile_image_url} alt={ownerName} />
                )}
                <AvatarFallback className="text-xs">
                  {ownerName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  {ownerName}{" "}
                  <span className="text-xs text-muted-foreground">(Owner)</span>
                </div>
                <div className="text-xs text-muted-foreground">Author</div>
              </div>
            </div>
            <div className="w-24 flex justify-center">
              <Checkbox checked disabled />
            </div>
            <div className="w-24 text-center text-sm text-muted-foreground">Full</div>
            <div className="w-6" />
          </div>

          {shares.length === 0 ? (
            <div className="text-sm text-muted-foreground px-1 py-3 text-center border border-dashed rounded-md">
              No groups added yet. Search above to add one.
            </div>
          ) : (
            shares.map((s) => (
              <div
                key={s.id}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-1"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      <Users className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{s.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.member_count ?? 0} member{s.member_count === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>
                <div className="w-24 flex items-center justify-center gap-2">
                  <Checkbox
                    id={`req-${s.id}`}
                    checked={s.completion_required}
                    onCheckedChange={(v) =>
                      updateShare(s.id, { completion_required: !!v })
                    }
                  />
                  <Label htmlFor={`req-${s.id}`} className="text-xs cursor-pointer">
                    Required
                  </Label>
                </div>
                <div className="w-24">
                  <Select
                    value={s.access_level}
                    onValueChange={(v) =>
                      updateShare(s.id, { access_level: v as WikiAccessLevel })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">{accessLabel.view}</SelectItem>
                      <SelectItem value="edit">{accessLabel.edit}</SelectItem>
                      <SelectItem value="full">{accessLabel.full}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => removeGroup(s.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Discoverability */}
        <div className="border rounded-lg p-4 space-y-2">
          <div>
            <div className="text-sm font-semibold">Discoverability</div>
            <div className="text-xs text-muted-foreground">
              Once published, how will this content be accessed in the account?
            </div>
          </div>
          <Select
            value={discoverability}
            onValueChange={(v) => setDiscoverability(v as WikiDiscoverability)}
          >
            <SelectTrigger
              className={
                discoverability === "discoverable"
                  ? "bg-green-100 dark:bg-green-950/40 border-green-300 dark:border-green-900"
                  : discoverability === "request"
                  ? "bg-yellow-100 dark:bg-yellow-950/40 border-yellow-300 dark:border-yellow-900"
                  : "bg-red-100 dark:bg-red-950/40 border-red-300 dark:border-red-900"
              }
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                value="discoverable"
                className="bg-green-100 dark:bg-green-950/40 focus:bg-green-200 dark:focus:bg-green-900/50 my-1 rounded-md"
              >
                <div className="flex flex-col">
                  <span className="font-medium">Discoverable</span>
                  <span className="text-xs text-muted-foreground">
                    All users can find and view this content.
                  </span>
                </div>
              </SelectItem>
              <SelectItem
                value="request"
                className="bg-yellow-100 dark:bg-yellow-950/40 focus:bg-yellow-200 dark:focus:bg-yellow-900/50 my-1 rounded-md"
              >
                <div className="flex flex-col">
                  <span className="font-medium">Request</span>
                  <span className="text-xs text-muted-foreground">
                    All users can find and request to view this content.
                  </span>
                </div>
              </SelectItem>
              <SelectItem
                value="private"
                className="bg-red-100 dark:bg-red-950/40 focus:bg-red-200 dark:focus:bg-red-900/50 my-1 rounded-md"
              >
                <div className="flex flex-col">
                  <span className="font-medium">Private</span>
                  <span className="text-xs text-muted-foreground">
                    Only Admins and those shared with can view this content.
                  </span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Public share */}
        <div className="border rounded-lg p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-medium">Public share</div>
              <div className="text-xs text-muted-foreground truncate">
                Anyone with the link can view (no sign-in required).
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {publicShare && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyPublicLink}
              >
                <Link2 className="h-3.5 w-3.5 mr-1.5" />
                Copy link
              </Button>
            )}
            <Switch checked={publicShare} onCheckedChange={setPublicShare} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareSubjectDialog;
