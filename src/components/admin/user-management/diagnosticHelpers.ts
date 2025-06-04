
import { DiagnosticInfo, OrphanedRoleData } from "./types";
import { fetchOrphanedRoleEmails } from "./authHelpers";

export const createDiagnosticInfo = async (
  profilesCount: number,
  rolesCount: number,
  authUsersCount: number,
  roleCounts: Record<string, number>,
  orphanedRoles: OrphanedRoleData[] | null
): Promise<DiagnosticInfo> => {
  // Get orphaned role emails if there are orphaned roles
  const orphanedUserIds = orphanedRoles?.map((r: OrphanedRoleData) => r.user_id) || [];
  const orphanedRoleEmails = await fetchOrphanedRoleEmails(orphanedUserIds);

  console.log(`=== FINAL COUNTS ===`);
  console.log(`Profiles: ${profilesCount}`);
  console.log(`Roles: ${rolesCount}`);
  console.log(`Auth users: ${authUsersCount}`);
  console.log(`Orphaned roles: ${orphanedRoles?.length || 0}`);
  console.log('Role distribution:', roleCounts);
  console.log(`Users displayed will be based on roles: ${rolesCount > 0 ? 'Yes' : 'No'}`);
  
  // Calculate missing profiles based on auth users vs existing profiles
  const missingProfilesCount = Math.max(0, authUsersCount - profilesCount);
  console.log(`Missing profiles calculation: ${authUsersCount} auth users - ${profilesCount} profiles = ${missingProfilesCount}`);
  
  return {
    profilesCount,
    rolesCount,
    authUsersCount,
    roleCounts,
    orphanedRolesCount: orphanedRoles?.length || 0,
    missingProfilesCount,
    timestamp: new Date().toISOString(),
    orphanedRoleEmails
  };
};
