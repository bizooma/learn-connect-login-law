import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export type PnpLevel = "admin" | "author" | "contributor" | "general";

export const PNP_LEVEL_OPTIONS: {
  value: PnpLevel;
  label: string;
  description: string;
}[] = [
  {
    value: "admin",
    label: "Admin",
    description: "Can manage the entire platform except for billing settings.",
  },
  {
    value: "author",
    label: "Author",
    description:
      "Can create new content as well as publish, share, and edit any content shared with them.",
  },
  {
    value: "contributor",
    label: "Contributor",
    description:
      "Can edit content they're assigned to. All edits to unpublished content must be reviewed and published by someone with a higher permission level.",
  },
  {
    value: "general",
    label: "General",
    description: "Can view content they're assigned to.",
  },
];

/** Current user's own effective level (used for UI gating). */
export const useMyPnpLevel = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["pnp-level", "me", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<PnpLevel> => {
      const { data, error } = await supabase.rpc("pnp_permission_level", {
        _user_id: user!.id,
      });
      if (error) throw error;
      return (data as PnpLevel) ?? "general";
    },
  });
};

/** Bulk fetch of stored levels for a set of users (defaults to 'general' when missing). */
export const useWikiPermissionsForUsers = (userIds: string[]) => {
  return useQuery({
    queryKey: ["wiki-permissions", "bulk", userIds.slice().sort().join(",")],
    enabled: userIds.length > 0,
    queryFn: async (): Promise<Record<string, PnpLevel>> => {
      const { data, error } = await supabase
        .from("wiki_permissions")
        .select("user_id, level")
        .in("user_id", userIds);
      if (error) throw error;
      const map: Record<string, PnpLevel> = {};
      for (const r of data ?? []) map[(r as any).user_id] = (r as any).level;
      return map;
    },
  });
};

export const useSetWikiPermission = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ userId, level }: { userId: string; level: PnpLevel }) => {
      const { error } = await supabase
        .from("wiki_permissions")
        .upsert(
          { user_id: userId, level, granted_by: user?.id ?? null },
          { onConflict: "user_id" }
        );
      if (error) throw error;
      return { userId, level };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wiki-permissions"] });
      qc.invalidateQueries({ queryKey: ["pnp-level"] });
      toast({ title: "Permission updated" });
    },
    onError: (err: any) => {
      toast({
        title: "Could not update permission",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
    },
  });
};
