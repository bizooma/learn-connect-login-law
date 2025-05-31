
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

  // Calculate unique users with roles
  const uniqueUsersWithRoles = rolesCount > 0 ? Object.values(roleCounts).length > 0 ? 
    Math.max(...Object.values(roleCounts)) : rolesCount : 0;

  console.log(`=== FINAL COUNTS ===`);
  console.log(`Profiles: ${profilesCount}`);
  console.log(`Roles: ${rolesCount}`);
  console.log(`Auth users: ${authUsersCount}`);
  console.log(`Orphaned roles: ${orphanedRoles?.length || 0}`);
  console.log('Role distribution:', roleCounts);
  console.log(`Users displayed will be based on roles: ${rolesCount > 0 ? 'Yes' : 'No'}`);
  
  return {
    profilesCount,
    rolesCount,
    authUsersCount,
    roleCounts,
    orphanedRolesCount: orphanedRoles?.length || 0,
    missingProfilesCount: Math.max(0, rolesCount - profilesCount),
    timestamp: new Date().toISOString(),
    orphanedRoleEmails
  };
};
