import { UserProfile } from "./types";

export const getUserRole = (user: UserProfile): string => {
  // Pick the highest-priority non-tester role for display
  const priority = ["admin", "owner", "team_leader", "client", "student", "free"];
  const roles = user.roles || [];
  for (const r of priority) if (roles.includes(r)) return r;
  return roles[0] || "student";
};

export const getRoleBadgeColor = (role: string): string => {
  switch (role) {
    case "admin":
      return "bg-red-100 text-red-800";
    case "owner":
      return "bg-purple-100 text-purple-800";
    case "team_leader":
      return "bg-orange-100 text-orange-800";
    case "student":
      return "bg-blue-100 text-blue-800";
    case "client":
      return "bg-green-100 text-green-800";
    case "free":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-blue-100 text-blue-800";
  }
};

export const getAvailableRoles = (isAdmin: boolean, isOwner: boolean) => {
  if (isAdmin) {
    return [
      { value: "free", label: "Free" },
      { value: "student", label: "Student" },
      { value: "client", label: "Client" },
      { value: "team_leader", label: "Team Leader" },
      { value: "owner", label: "Owner" },
      { value: "admin", label: "Admin" },
    ];
  } else if (isOwner) {
    return [
      { value: "free", label: "Free" },
      { value: "student", label: "Student" },
      { value: "client", label: "Client" },
    ];
  }
  return [];
};

export interface UserFilters {
  roles: string[];
  tester: "any" | "yes" | "no";
  groupIds: string[];
  activity: "any" | "7d" | "30d" | "90d" | "never";
  assignment: "any" | "no_group" | "no_course";
}

export const emptyFilters: UserFilters = {
  roles: [],
  tester: "any",
  groupIds: [],
  activity: "any",
  assignment: "any",
};

export const hasActiveFilters = (f: UserFilters): boolean =>
  f.roles.length > 0 ||
  f.tester !== "any" ||
  f.groupIds.length > 0 ||
  f.activity !== "any" ||
  f.assignment !== "any";

export interface EnrichedUserMeta {
  lastLoginAt?: string | null;
  groupIds?: string[];
  isTester?: boolean;
  courseCount?: number;
}

export const filterUsers = (
  users: UserProfile[],
  searchTerm: string,
  filters: UserFilters = emptyFilters,
  meta: Record<string, EnrichedUserMeta> = {}
): UserProfile[] => {
  const term = searchTerm.trim().toLowerCase();
  const now = Date.now();
  const windowMs = (d: number) => d * 24 * 60 * 60 * 1000;

  return users.filter((user) => {
    if (term) {
      const name = `${user.first_name || ""} ${user.last_name || ""}`.toLowerCase();
      if (!user.email.toLowerCase().includes(term) && !name.includes(term)) return false;
    }

    const role = getUserRole(user);
    if (filters.roles.length > 0 && !filters.roles.includes(role)) return false;

    const m = meta[user.id] || {};

    if (filters.tester === "yes" && !m.isTester) return false;
    if (filters.tester === "no" && m.isTester) return false;

    if (filters.groupIds.length > 0) {
      const ids = m.groupIds || [];
      if (!filters.groupIds.some((g) => ids.includes(g))) return false;
    }

    if (filters.activity !== "any") {
      const last = m.lastLoginAt ? new Date(m.lastLoginAt).getTime() : 0;
      if (filters.activity === "never") {
        if (last > 0) return false;
      } else {
        const d = filters.activity === "7d" ? 7 : filters.activity === "30d" ? 30 : 90;
        if (!last || now - last > windowMs(d)) return false;
      }
    }

    if (filters.assignment === "no_group" && (m.groupIds?.length || 0) > 0) return false;
    if (filters.assignment === "no_course" && (m.courseCount || 0) > 0) return false;

    return true;
  });
};
