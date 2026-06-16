import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DirectoryUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  job_title: string | null;
  profile_image_url: string | null;
}

export const useDirectoryUsers = () => {
  return useQuery({
    queryKey: ["directory-users", "newfrontier"],
    queryFn: async (): Promise<DirectoryUser[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, job_title, profile_image_url")
        .ilike("email", "%@newfrontier.us")
        .eq("is_deleted", false)
        .order("first_name", { ascending: true });

      if (error) throw error;
      return (data ?? []) as DirectoryUser[];
    },
  });
};
