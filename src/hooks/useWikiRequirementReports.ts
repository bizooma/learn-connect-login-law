import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SubjectMeta {
  id: string;
  title: string;
  icon_name: string | null;
  updated_at: string;
  is_published: boolean;
}

export interface PersonRow {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  job_title: string | null;
  profile_image_url: string | null;
  required_count: number;
  avg_pct: number;
  last_login: string | null;
  groups: { id: string; name: string }[];
}

export interface SubjectRow extends SubjectMeta {
  required_count: number;
  avg_pct: number;
}

export interface UserSubjectCell {
  user_id: string;
  category_id: string;
  progress_pct: number;
  status: string;
}

export interface WikiRequirementData {
  people: PersonRow[];
  subjects: SubjectRow[];
  cells: UserSubjectCell[];
  subjectMeta: Map<string, SubjectMeta>;
  peopleById: Map<string, PersonRow>;
  requiredByUser: Map<string, Set<string>>;
  requiredBySubject: Map<string, Set<string>>;
}

export const useWikiRequirementReports = () => {
  return useQuery<WikiRequirementData>({
    queryKey: ["wiki-requirement-reports"],
    queryFn: async () => {
      const [
        profilesRes,
        catsRes,
        catUsersRes,
        catGroupsRes,
        groupMembersRes,
        groupsRes,
        progressRes,
        sessionsRes,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, first_name, last_name, email, job_title, profile_image_url")
          .eq("is_deleted", false)
          .ilike("email", "%@newfrontier.us"),
        supabase
          .from("wiki_categories")
          .select("id, title, icon_name, updated_at, is_published"),
        supabase
          .from("wiki_category_users")
          .select("category_id, user_id, completion_required"),
        supabase
          .from("wiki_category_groups")
          .select("category_id, group_id, completion_required"),
        supabase.from("group_members").select("group_id, user_id"),
        supabase.from("groups").select("id, name"),
        supabase
          .from("wiki_subject_progress")
          .select("user_id, category_id, progress_pct, status"),
        supabase
          .from("user_sessions")
          .select("user_id, session_start")
          .order("session_start", { ascending: false })
          .limit(5000),
      ]);

      const profiles = profilesRes.data ?? [];
      const cats = (catsRes.data ?? []) as SubjectMeta[];
      const catUsers = catUsersRes.data ?? [];
      const catGroups = catGroupsRes.data ?? [];
      const groupMembers = groupMembersRes.data ?? [];
      const groupsList = groupsRes.data ?? [];
      const progress = progressRes.data ?? [];
      const sessions = sessionsRes.data ?? [];

      const subjectMeta = new Map<string, SubjectMeta>();
      cats.forEach((c) => subjectMeta.set(c.id, c));

      const groupNameById = new Map<string, string>();
      groupsList.forEach((g: any) => groupNameById.set(g.id, g.name));

      const membersByGroup = new Map<string, string[]>();
      groupMembers.forEach((m: any) => {
        if (!membersByGroup.has(m.group_id)) membersByGroup.set(m.group_id, []);
        membersByGroup.get(m.group_id)!.push(m.user_id);
      });

      const groupsByUser = new Map<string, { id: string; name: string }[]>();
      groupMembers.forEach((m: any) => {
        const name = groupNameById.get(m.group_id);
        if (!name) return;
        if (!groupsByUser.has(m.user_id)) groupsByUser.set(m.user_id, []);
        groupsByUser.get(m.user_id)!.push({ id: m.group_id, name });
      });

      // Build required (user, subject) pairs
      const requiredByUser = new Map<string, Set<string>>();
      const requiredBySubject = new Map<string, Set<string>>();
      const addReq = (uid: string, cid: string) => {
        if (!requiredByUser.has(uid)) requiredByUser.set(uid, new Set());
        requiredByUser.get(uid)!.add(cid);
        if (!requiredBySubject.has(cid)) requiredBySubject.set(cid, new Set());
        requiredBySubject.get(cid)!.add(uid);
      };
      catUsers.forEach((r: any) => {
        if (r.completion_required) addReq(r.user_id, r.category_id);
      });
      catGroups.forEach((r: any) => {
        if (!r.completion_required) return;
        (membersByGroup.get(r.group_id) ?? []).forEach((uid) => addReq(uid, r.category_id));
      });

      // Progress lookup
      const pctByPair = new Map<string, number>();
      const statusByPair = new Map<string, string>();
      progress.forEach((p: any) => {
        const key = `${p.user_id}::${p.category_id}`;
        pctByPair.set(key, Number(p.progress_pct) || 0);
        statusByPair.set(key, p.status);
      });

      // Last login by user
      const lastLoginByUser = new Map<string, string>();
      sessions.forEach((s: any) => {
        if (!lastLoginByUser.has(s.user_id)) lastLoginByUser.set(s.user_id, s.session_start);
      });

      const people: PersonRow[] = profiles.map((p: any) => {
        const reqSet = requiredByUser.get(p.id) ?? new Set<string>();
        let sum = 0;
        reqSet.forEach((cid) => {
          sum += pctByPair.get(`${p.id}::${cid}`) ?? 0;
        });
        const avg = reqSet.size > 0 ? Math.round(sum / reqSet.size) : 0;
        return {
          user_id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          email: p.email,
          job_title: p.job_title,
          profile_image_url: p.profile_image_url,
          required_count: reqSet.size,
          avg_pct: avg,
          last_login: lastLoginByUser.get(p.id) ?? null,
          groups: groupsByUser.get(p.id) ?? [],
        };
      });

      const subjects: SubjectRow[] = cats.map((c) => {
        const reqSet = requiredBySubject.get(c.id) ?? new Set<string>();
        let sum = 0;
        reqSet.forEach((uid) => {
          sum += pctByPair.get(`${uid}::${c.id}`) ?? 0;
        });
        const avg = reqSet.size > 0 ? Math.round(sum / reqSet.size) : 0;
        return {
          ...c,
          required_count: reqSet.size,
          avg_pct: avg,
        };
      });

      const cells: UserSubjectCell[] = [];
      requiredByUser.forEach((set, uid) => {
        set.forEach((cid) => {
          const key = `${uid}::${cid}`;
          cells.push({
            user_id: uid,
            category_id: cid,
            progress_pct: pctByPair.get(key) ?? 0,
            status: statusByPair.get(key) ?? "not_started",
          });
        });
      });

      const peopleById = new Map(people.map((p) => [p.user_id, p]));

      return {
        people,
        subjects,
        cells,
        subjectMeta,
        peopleById,
        requiredByUser,
        requiredBySubject,
      };
    },
  });
};
