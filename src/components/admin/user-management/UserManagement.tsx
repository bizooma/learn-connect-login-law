import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useGroups } from "@/hooks/useGroups";
import { supabase } from "@/integrations/supabase/client";
import UserSearch from "./UserSearch";
import { UserGrid } from "./UserGrid";
import SimplifiedUserManagementHeader from "./SimplifiedUserManagementHeader";
import EmptyUserState from "./EmptyUserState";
import LoadingState from "./LoadingState";
import UserProgressModal from "../user-progress/UserProgressModal";
import UserFiltersBar from "./UserFiltersBar";
import BulkActionsBar from "./BulkActionsBar";
import UserDetailDrawer from "./UserDetailDrawer";
import {
  filterUsers,
  emptyFilters,
  UserFilters,
  EnrichedUserMeta,
} from "./userRoleUtils";
import { UserProfile } from "./types";
import {
  fetchUsersWithStatsSafe,
  updateUserRoleSafe,
} from "./updatedUserManagementService";

const ITEMS_PER_PAGE = 12;

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({ totalUsers: 0, roleCounts: {} });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserForProgress, setSelectedUserForProgress] = useState<string | null>(
    null
  );
  const [filters, setFilters] = useState<UserFilters>(emptyFilters);
  const [metaById, setMetaById] = useState<Record<string, EnrichedUserMeta>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const { groups } = useGroups();

  const groupNameById = useMemo(() => {
    const m: Record<string, string> = {};
    groups.forEach((g) => {
      m[g.id] = g.name;
    });
    return m;
  }, [groups]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { users: fetchedUsers, stats: fetchedStats } = await fetchUsersWithStatsSafe();
      setUsers(fetchedUsers);
      setStats(fetchedStats);
      setCurrentPage(1);
    } catch (error: any) {
      console.error("❌ Error fetching users:", error);
      toast({
        title: "Error",
        description: `Failed to fetch users: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Enrich users with last-login, group memberships, tester flag, course count
  const fetchMeta = useCallback(async () => {
    try {
      const [sessions, groupMembers, testerRoles, courseAssigns] = await Promise.all([
        supabase
          .from("user_sessions")
          .select("user_id, session_start")
          .order("session_start", { ascending: false })
          .limit(5000),
        supabase.from("group_members" as any).select("user_id, group_id"),
        supabase.from("user_roles").select("user_id").eq("role", "tester" as any),
        supabase.from("course_assignments").select("user_id"),
      ]);

      const meta: Record<string, EnrichedUserMeta> = {};

      (sessions.data || []).forEach((row: any) => {
        const cur = meta[row.user_id] || {};
        if (!cur.lastLoginAt || row.session_start > cur.lastLoginAt) {
          cur.lastLoginAt = row.session_start;
        }
        meta[row.user_id] = cur;
      });

      (groupMembers.data as any[] | null)?.forEach((row) => {
        const cur = meta[row.user_id] || {};
        cur.groupIds = [...(cur.groupIds || []), row.group_id];
        meta[row.user_id] = cur;
      });

      (testerRoles.data || []).forEach((row: any) => {
        const cur = meta[row.user_id] || {};
        cur.isTester = true;
        meta[row.user_id] = cur;
      });

      (courseAssigns.data || []).forEach((row: any) => {
        const cur = meta[row.user_id] || {};
        cur.courseCount = (cur.courseCount || 0) + 1;
        meta[row.user_id] = cur;
      });

      setMetaById(meta);
    } catch (err) {
      console.error("fetchMeta error", err);
    }
  }, []);

  const updateUserRole = async (
    userId: string,
    newRole: "admin" | "owner" | "student" | "client" | "free" | "team_leader"
  ) => {
    try {
      if (
        !isAdmin &&
        (newRole === "admin" || newRole === "owner" || newRole === "team_leader")
      ) {
        toast({
          title: "Access Denied",
          description:
            "You don't have permission to assign admin, owner, or team leader roles",
          variant: "destructive",
        });
        return;
      }
      await updateUserRoleSafe(userId, newRole, "Administrative role change");
      await fetchUsers();
      toast({ title: "Success", description: "User role updated" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchMeta();

    const channel = supabase
      .channel("admin-users-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => setTimeout(() => fetchUsers(), 100)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_roles" },
        () => setTimeout(() => {
          fetchUsers();
          fetchMeta();
        }, 100)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "course_assignments" },
        () => setTimeout(() => {
          fetchUsers();
          fetchMeta();
        }, 100)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_members" },
        () => setTimeout(() => fetchMeta(), 100)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = useMemo(
    () => filterUsers(users, searchTerm, filters, metaById),
    [users, searchTerm, filters, metaById]
  );

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleViewProgress = (userId: string) => setSelectedUserForProgress(userId);

  const handleToggleSelected = (userId: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(userId);
      else next.delete(userId);
      return next;
    });
  };

  const pageSelectionState = useMemo(() => {
    const allOnPage = paginatedUsers.every((u) => selectedIds.has(u.id));
    const someOnPage = paginatedUsers.some((u) => selectedIds.has(u.id));
    return { all: allOnPage && paginatedUsers.length > 0, some: someOnPage };
  }, [paginatedUsers, selectedIds]);

  const toggleSelectPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (pageSelectionState.all) {
        paginatedUsers.forEach((u) => next.delete(u.id));
      } else {
        paginatedUsers.forEach((u) => next.add(u.id));
      }
      return next;
    });
  };

  const detailUser = detailUserId ? users.find((u) => u.id === detailUserId) || null : null;
  const detailMeta = detailUserId ? metaById[detailUserId] : undefined;

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <SimplifiedUserManagementHeader stats={stats} onRefresh={fetchUsers} />

      <UserSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      <UserFiltersBar
        filters={filters}
        onChange={setFilters}
        totalUsers={users.length}
        filteredCount={filteredUsers.length}
        allSelected={pageSelectionState.all}
        someSelected={pageSelectionState.some && !pageSelectionState.all}
        onToggleSelectAll={toggleSelectPage}
      />

      <BulkActionsBar
        selectedIds={Array.from(selectedIds)}
        users={users}
        metaById={metaById}
        groupNameById={groupNameById}
        onClear={() => setSelectedIds(new Set())}
        onRefresh={() => {
          fetchUsers();
          fetchMeta();
        }}
        filteredUsers={filteredUsers}
      />

      <UserGrid
        users={paginatedUsers}
        onRoleUpdate={updateUserRole}
        onUserDeleted={fetchUsers}
        onCourseAssigned={fetchUsers}
        onViewProgress={handleViewProgress}
        currentPage={currentPage}
        totalPages={totalPages}
        totalUsers={filteredUsers.length}
        onPageChange={handlePageChange}
        hasNextPage={currentPage < totalPages}
        hasPreviousPage={currentPage > 1}
        selectedIds={selectedIds}
        onToggleSelected={handleToggleSelected}
        onOpenDetail={setDetailUserId}
      />

      {users.length === 0 && (
        <EmptyUserState diagnosticInfo={null} onRefresh={fetchUsers} />
      )}

      <UserProgressModal
        isOpen={!!selectedUserForProgress}
        onClose={() => setSelectedUserForProgress(null)}
        userId={selectedUserForProgress}
      />

      <UserDetailDrawer
        open={!!detailUserId}
        onOpenChange={(o) => !o && setDetailUserId(null)}
        user={detailUser}
        isTester={!!detailMeta?.isTester}
        groupNames={(detailMeta?.groupIds || []).map(
          (id) => groupNameById[id] || id
        )}
        lastLoginAt={detailMeta?.lastLoginAt || null}
        onOpenProgress={(uid) => {
          setDetailUserId(null);
          setSelectedUserForProgress(uid);
        }}
      />
    </div>
  );
};

export default UserManagement;
