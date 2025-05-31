
export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  roles?: Array<{ role: string }>;
}

export interface DiagnosticInfo {
  profilesCount: number;
  rolesCount: number;
  authUsersCount: number;
  roleCounts: Record<string, number>;
  orphanedRolesCount: number;
  missingProfilesCount: number;
  timestamp: string;
  orphanedRoleEmails?: string[];
}

export interface ProfileData {
  id: string;
}

export interface OrphanedRoleData {
  user_id: string;
  role: string;
}
