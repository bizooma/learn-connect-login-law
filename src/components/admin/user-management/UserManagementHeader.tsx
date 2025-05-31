
import { DiagnosticInfo } from "./types";

interface UserManagementHeaderProps {
  usersCount: number;
  diagnosticInfo: DiagnosticInfo | null;
}

const UserManagementHeader = ({ usersCount, diagnosticInfo }: UserManagementHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold">User Management</h2>
      <div className="text-sm text-gray-600">
        <div>{usersCount} users loaded</div>
        {diagnosticInfo && (
          <div className="text-xs text-gray-500 mt-1">
            DB: {diagnosticInfo.profilesCount} profiles, {diagnosticInfo.rolesCount} users with roles
            {diagnosticInfo.authUsersCount > 0 && `, ${diagnosticInfo.authUsersCount} auth users`}
            {diagnosticInfo.roleCounts && (
              <div className="text-xs mt-1">
                Admins: {diagnosticInfo.roleCounts.admin || 0}, Students: {diagnosticInfo.roleCounts.student || 0}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementHeader;
