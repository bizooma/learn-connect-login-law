import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Props {
  categoryId: string;
  sharedGroups: { id: string; name: string }[];
}

const ShareGroupsPicker = ({ categoryId, sharedGroups }: Props) => {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data: groups = [] } = useQuery({
    queryKey: ["all-groups-for-share"],
    queryFn: async () => {
      const { data, error } = await supabase.from("groups").select("id, name").order("name");
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
    enabled: open,
  });

  const selected = new Set(sharedGroups.map((g) => g.id));

  const toggle = useMutation({
    mutationFn: async (groupId: string) => {
      if (selected.has(groupId)) {
        const { error } = await supabase
          .from("wiki_category_groups")
          .delete()
          .eq("category_id", categoryId)
          .eq("group_id", groupId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("wiki_category_groups")
          .insert({ category_id: categoryId, group_id: groupId });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wiki-categories"] }),
    onError: (e: any) => toast.error("Failed to update share: " + e.message),
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground min-w-0 max-w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <Users className="h-3.5 w-3.5 shrink-0" />
          {sharedGroups.length === 0 ? (
            <span className="text-muted-foreground/70">Share…</span>
          ) : sharedGroups.length <= 2 ? (
            <span className="truncate">{sharedGroups.map((g) => g.name).join(", ")}</span>
          ) : (
            <Badge variant="secondary" className="text-xs">{sharedGroups.length} groups</Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start" onClick={(e) => e.stopPropagation()}>
        <Command>
          <CommandInput placeholder="Search groups…" />
          <CommandList>
            <CommandEmpty>No groups found.</CommandEmpty>
            <CommandGroup>
              {groups.map((g) => {
                const isSelected = selected.has(g.id);
                return (
                  <CommandItem
                    key={g.id}
                    onSelect={() => toggle.mutate(g.id)}
                    className="cursor-pointer"
                  >
                    <Check className={`h-4 w-4 mr-2 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                    {g.name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ShareGroupsPicker;
