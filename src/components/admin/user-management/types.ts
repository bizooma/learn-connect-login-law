
export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  law_firm_name?: string;
  created_at: string;
  profile_image_url?: string;
  roles?: string[];
  deleted_at?: string; // Added for soft delete functionality
  // Add flag to indicate if this user has a complete profile record
  hasCompleteProfile?: boolean;
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
