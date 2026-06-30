import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

export interface OrgPeopleSettings {
  directoryEnabled: boolean;
  directoryRestrictedGroups: string[];
  peopleChartEnabled: boolean;
  peopleChartRestrictedGroups: string[];
  roleChartEnabled: boolean;
  roleChartRestrictedGroups: string[];
  shareReportsWithDirectReports: boolean;
}

const DEFAULTS: OrgPeopleSettings = {
  directoryEnabled: true,
  directoryRestrictedGroups: [],
  peopleChartEnabled: true,
  peopleChartRestrictedGroups: [],
  roleChartEnabled: true,
  roleChartRestrictedGroups: [],
  shareReportsWithDirectReports: false,
};

export const useOrgPeopleSettings = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["org-people-settings"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<OrgPeopleSettings> => {
      const { data, error } = await supabase
        .from("organization_settings" as any)
        .select(
          "people_directory_enabled, people_directory_restricted_groups, people_chart_enabled, people_chart_restricted_groups, people_role_chart_enabled, people_role_chart_restricted_groups, people_share_reports_direct_reports"
        )
        .eq("singleton", true)
        .maybeSingle();
      if (error || !data) return DEFAULTS;
      const r: any = data;
      return {
        directoryEnabled: r.people_directory_enabled ?? true,
        directoryRestrictedGroups: r.people_directory_restricted_groups ?? [],
        peopleChartEnabled: r.people_chart_enabled ?? true,
        peopleChartRestrictedGroups: r.people_chart_restricted_groups ?? [],
        roleChartEnabled: r.people_role_chart_enabled ?? true,
        roleChartRestrictedGroups: r.people_role_chart_restricted_groups ?? [],
        shareReportsWithDirectReports: r.people_share_reports_with_direct_reports ?? false,
      };
    },
  });

  return { settings: data ?? DEFAULTS, isLoading };
};

/** Returns the current user's group ids (for restriction checks). */
export const useMyGroupIds = () => {
  return useQuery({
    queryKey: ["my-group-ids"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<string[]> => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return [];
      const { data } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", uid);
      return (data ?? []).map((r: any) => r.group_id);
    },
  });
};

/** Admins always pass. If no restricted groups configured, everyone passes. Else user must be in at least one. */
export const useFeatureAccess = (enabled: boolean, restrictedGroups: string[]) => {
  const { isAdmin } = useUserRole();
  const { data: myGroups = [], isLoading } = useMyGroupIds();
  if (!enabled) return { allowed: false, isLoading: false };
  if (isAdmin) return { allowed: true, isLoading: false };
  if (!restrictedGroups || restrictedGroups.length === 0) return { allowed: true, isLoading };
  const allowed = myGroups.some((g) => restrictedGroups.includes(g));
  return { allowed, isLoading };
};
