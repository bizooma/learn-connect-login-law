import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DirectoryUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  job_title: string | null;
  profile_image_url: string | null;
  department: string | null;
  roles: string[];
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

      let rolesByUser: Record<string, string[]> = {};
      if (ids.length) {
        const { data: roleRows, error: roleErr } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", ids);
        if (roleErr) throw roleErr;
        for (const r of roleRows ?? []) {
          (rolesByUser[(r as any).user_id] ||= []).push((r as any).role);
        }
      }

      return profiles.map((p: any) => ({
        ...p,
        roles: rolesByUser[p.id] ?? [],
      })) as DirectoryUser[];
    },
  });
};
