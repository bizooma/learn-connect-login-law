import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type GroupType = "Role" | "Department" | "Team" | "Custom";

export interface Group {
  id: string;
  name: string;
  type: GroupType;
  description: string | null;
  manager_id: string | null;
  manager_name?: string | null;
  member_count?: number;
  created_at: string;
}

export interface GroupMember {
  id: string;
  user_id: string;
  group_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
}

export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("groups" as any)
        .select("*")
        .order("name");
      if (error) throw error;

      const rows = (data ?? []) as any[];

      // Member counts
      const { data: members } = await supabase
        .from("group_members" as any)
        .select("group_id");
      const counts = new Map<string, number>();
      (members ?? []).forEach((m: any) => {
        counts.set(m.group_id, (counts.get(m.group_id) ?? 0) + 1);
      });

      // Manager names
      const managerIds = Array.from(
        new Set(rows.map((g) => g.manager_id).filter(Boolean))
      ) as string[];
      let managerMap = new Map<string, string>();
      if (managerIds.length > 0) {
        const { data: managers } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .in("id", managerIds);
        (managers ?? []).forEach((p: any) => {
          managerMap.set(
            p.id,
            [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email
          );
        });
      }

      const enriched: Group[] = rows.map((g) => ({
        ...g,
        manager_name: g.manager_id ? managerMap.get(g.manager_id) ?? null : null,
        member_count: counts.get(g.id) ?? 0,
      }));
      setGroups(enriched);
    } catch (err) {
      console.error("Failed to fetch groups", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = useCallback(
    async (input: { name: string; type: GroupType; description?: string; manager_id?: string | null }) => {
      const userRes = await supabase.auth.getUser();
      const { error } = await supabase.from("groups" as any).insert({
        name: input.name,
        type: input.type,
        description: input.description || null,
        manager_id: input.manager_id || null,
        created_by: userRes.data.user?.id ?? null,
      });
      if (error) throw error;
      await fetchGroups();
    },
    [fetchGroups]
  );

  const updateGroup = useCallback(
    async (id: string, input: { name: string; type: GroupType; description?: string; manager_id?: string | null }) => {
      const { error } = await supabase
        .from("groups" as any)
        .update({
          name: input.name,
          type: input.type,
          description: input.description || null,
          manager_id: input.manager_id || null,
        })
        .eq("id", id);
      if (error) throw error;
      await fetchGroups();
    },
    [fetchGroups]
  );

  const deleteGroup = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("groups" as any).delete().eq("id", id);
      if (error) throw error;
      await fetchGroups();
    },
    [fetchGroups]
  );

  return { groups, loading, fetchGroups, createGroup, updateGroup, deleteGroup };
};

export const useGroupMembers = (groupId: string | null) => {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!groupId) {
      setMembers([]);
      return;
    }
    setLoading(true);
    try {
      const { data: gm } = await supabase
        .from("group_members" as any)
        .select("id, user_id, group_id")
        .eq("group_id", groupId);
      const rows = (gm ?? []) as any[];
      if (rows.length === 0) {
        setMembers([]);
        return;
      }
      const userIds = rows.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", userIds);
      const pMap = new Map<string, any>();
      (profiles ?? []).forEach((p: any) => pMap.set(p.id, p));
      setMembers(
        rows.map((r) => {
          const p = pMap.get(r.user_id) ?? {};
          return {
            id: r.id,
            user_id: r.user_id,
            group_id: r.group_id,
            first_name: p.first_name ?? null,
            last_name: p.last_name ?? null,
            email: p.email ?? "",
          };
        })
      );
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const addMember = useCallback(
    async (userId: string) => {
      if (!groupId) return;
      const userRes = await supabase.auth.getUser();
      const { error } = await supabase
        .from("group_members" as any)
        .insert({ group_id: groupId, user_id: userId, added_by: userRes.data.user?.id ?? null });
      if (error) throw error;
      await fetchMembers();
    },
    [groupId, fetchMembers]
  );

  const removeMember = useCallback(
    async (memberId: string) => {
      const { error } = await supabase.from("group_members" as any).delete().eq("id", memberId);
      if (error) throw error;
      await fetchMembers();
    },
    [fetchMembers]
  );

  return { members, loading, fetchMembers, addMember, removeMember };
};
