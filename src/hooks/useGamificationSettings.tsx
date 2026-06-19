import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GamificationSettings {
  enabled: boolean;
  streakFrequency: "weekly" | "monthly" | "quarterly";
  excludedGroupIds: string[];
  isUserExcluded: boolean;
  loading: boolean;
}

const DEFAULTS: GamificationSettings = {
  enabled: true,
  streakFrequency: "weekly",
  excludedGroupIds: [],
  isUserExcluded: false,
  loading: true,
};

// Tiny in-module cache so we don't refetch every render
let cache: GamificationSettings | null = null;
let cachePromise: Promise<GamificationSettings> | null = null;

const fetchSettings = async (): Promise<GamificationSettings> => {
  try {
    const { data: settings } = await supabase
      .from("organization_settings" as any)
      .select("gamification_enabled, streak_frequency, gamification_excluded_groups")
      .eq("singleton", true)
      .maybeSingle();

    const row: any = settings ?? {};
    const excluded: string[] = row.gamification_excluded_groups ?? [];

    // Check if current user is in any excluded group
    let isUserExcluded = false;
    if (excluded.length > 0) {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (uid) {
        const { data: memberships } = await supabase
          .from("group_members" as any)
          .select("group_id")
          .eq("user_id", uid)
          .in("group_id", excluded);
        isUserExcluded = (memberships?.length ?? 0) > 0;
      }
    }

    return {
      enabled: row.gamification_enabled ?? true,
      streakFrequency: (row.streak_frequency ?? "weekly") as GamificationSettings["streakFrequency"],
      excludedGroupIds: excluded,
      isUserExcluded,
      loading: false,
    };
  } catch (err) {
    console.error("Failed to load gamification settings", err);
    return { ...DEFAULTS, loading: false };
  }
};

export const invalidateGamificationCache = () => {
  cache = null;
  cachePromise = null;
};

export const useGamificationSettings = (): GamificationSettings => {
  const [state, setState] = useState<GamificationSettings>(cache ?? DEFAULTS);

  useEffect(() => {
    if (cache) {
      setState(cache);
      return;
    }
    if (!cachePromise) {
      cachePromise = fetchSettings().then((s) => {
        cache = s;
        return s;
      });
    }
    let mounted = true;
    cachePromise.then((s) => {
      if (mounted) setState(s);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return state;
};
