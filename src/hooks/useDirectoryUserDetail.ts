import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserActivitySummary {
  totalActivities: number;
  lastActiveAt: string | null;
  coursesInProgress: number;
  coursesCompleted: number;
  recentActivities: Array<{
    id: string;
    activity_type: string;
    created_at: string;
    metadata: any;
  }>;
}

export const useDirectoryUserDetail = (userId: string | null) => {
  return useQuery({
    enabled: !!userId,
    queryKey: ["directory-user-detail", userId],
    queryFn: async (): Promise<UserActivitySummary> => {
      if (!userId) throw new Error("no user");

      const [{ data: activities }, { data: progress }] = await Promise.all([
        supabase
          .from("user_activity_log")
          .select("id, activity_type, created_at, metadata")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("user_course_progress")
          .select("status")
          .eq("user_id", userId),
      ]);

      const { count: totalCount } = await supabase
        .from("user_activity_log")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

      const completed = (progress ?? []).filter((p: any) => p.status === "completed").length;
      const inProgress = (progress ?? []).filter((p: any) => p.status === "in_progress").length;

      return {
        totalActivities: totalCount ?? 0,
        lastActiveAt: activities?.[0]?.created_at ?? null,
        coursesCompleted: completed,
        coursesInProgress: inProgress,
        recentActivities: (activities ?? []) as any,
      };
    },
  });
};
