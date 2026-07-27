import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PnpLevel } from "@/hooks/useWikiPermission";

export interface DirectoryUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  job_title: string | null;
  profile_image_url: string | null;
  department: string | null;
  roles: string[];
  pnp_level: PnpLevel;
  pnp_level_locked: boolean; // true when derived from LMS admin/owner role
}

export const useDirectoryUsers = () => {
  return useQuery({
    queryKey: ["directory-users", "newfrontier"],
    queryFn: async (): Promise<DirectoryUser[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, job_title, profile_image_url, department")
        .ilike("email", "%@newfrontier.us")
        .eq("is_deleted", false)
        .order("first_name", { ascending: true });

      if (error) throw error;

      const profiles = data ?? [];
      const ids = profiles.map((p: any) => p.id);

      const rolesByUser: Record<string, string[]> = {};
      const permByUser: Record<string, PnpLevel> = {};

      if (ids.length) {
        const [rolesRes, permsRes] = await Promise.all([
          supabase.from("user_roles").select("user_id, role").in("user_id", ids),
          supabase.from("wiki_permissions").select("user_id, level").in("user_id", ids),
        ]);
        if (rolesRes.error) throw rolesRes.error;
        if (permsRes.error) throw permsRes.error;

        for (const r of rolesRes.data ?? []) {
          (rolesByUser[(r as any).user_id] ||= []).push((r as any).role);
        }
        for (const p of permsRes.data ?? []) {
          permByUser[(p as any).user_id] = (p as any).level;
        }
      }

      return profiles.map((p: any) => {
        const roles = rolesByUser[p.id] ?? [];
        const lmsAdmin = roles.includes("admin") || roles.includes("owner");
        const pnp_level: PnpLevel = lmsAdmin
          ? "admin"
          : (permByUser[p.id] ?? "general");
        return {
          ...p,
          roles,
          pnp_level,
          pnp_level_locked: lmsAdmin,
        };
      }) as DirectoryUser[];
    },
  });
};
