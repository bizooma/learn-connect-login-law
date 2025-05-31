
import { UserProfile, DiagnosticInfo } from "./types";
import { fetchBasicCounts, fetchRoleDistribution, fetchOrphanedRoles, fetchUserProfiles } from "./dataFetchers";
import { fetchAuthUsersCount } from "./authHelpers";
import { createDiagnosticInfo } from "./diagnosticHelpers";

export const fetchUsersData = async (): Promise<{
  users: UserProfile[];
  diagnosticInfo: DiagnosticInfo;
}> => {
  // Fetch basic counts
  const { profilesCount, rolesCount } = await fetchBasicCounts();
  
  // Fetch auth users count
  const authUsersCount = await fetchAuthUsersCount();
  
  // Fetch role distribution
  const { roleCounts } = await fetchRoleDistribution();
  
  // Fetch orphaned roles
  const { orphanedRoles } = await fetchOrphanedRoles();
  
  // Create diagnostic info
  const diagnosticInfo = await createDiagnosticInfo(
    profilesCount,
    rolesCount,
    authUsersCount,
    roleCounts,
    orphanedRoles
  );

  // Fetch user profiles
  const users = await fetchUserProfiles();

  console.log('=== END FETCH ===');
  
  return { users, diagnosticInfo };
};

// Re-export other operations
export { cleanupOrphanedRoles, updateUserRole } from "./roleOperations";
export { createMissingProfilesFromAuth as createMissingProfiles } from "./authHelpers";
