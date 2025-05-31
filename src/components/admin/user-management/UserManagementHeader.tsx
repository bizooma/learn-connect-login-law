
import { DiagnosticInfo } from "./types";

interface UserManagementHeaderProps {
  usersCount: number;
  diagnosticInfo: DiagnosticInfo | null;
}

const UserManagementHeader = ({ usersCount, diagnosticInfo }: UserManagementHeaderProps) => {
  // Calculate unique users from role counts
  const uniqueUsersWithRoles = diagnosticInfo ? 
    Object.keys(diagnosticInfo.roleCounts).length > 0 ? 
      new Set(Object.entries(diagnosticInfo.roleCounts).map(([role]) => role)).size 
    : 0 
  : 0;

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">User Management</h2>
      <div className="flex items-center space-x-4 text-sm text-gray-600">
        <span>Displaying {usersCount} users</span>
        {diagnosticInfo && (
          <>
            <span>•</span>
            <span>{diagnosticInfo.rolesCount} total roles assigned</span>
            <span>•</span>
            <span>{diagnosticInfo.profilesCount} complete profiles</span>
            {diagnosticInfo.missingProfilesCount > 0 && (
              <>
                <span>•</span>
                <span className="text-yellow-600 font-medium">
                  {diagnosticInfo.missingProfilesCount} incomplete profiles
                </span>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserManagementHeader;
