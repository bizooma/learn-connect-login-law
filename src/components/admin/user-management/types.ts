
export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  law_firm_name?: string;
  profile_image_url?: string;
  created_at: string;
  updated_at?: string;
  is_deleted?: boolean;
  deleted_at?: string;
  law_firm_id?: string;
  team_leader_id?: string;
  roles?: string[];
  hasCompleteProfile?: boolean;
}

export interface SimplifiedUserStats {
  totalUsers: number;
  roleCounts: Record<string, number>;
}
