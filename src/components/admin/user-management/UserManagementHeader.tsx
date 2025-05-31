
import { DiagnosticInfo } from "./types";
import AddUserDialog from "./AddUserDialog";

interface UserManagementHeaderProps {
  usersCount: number;
  diagnosticInfo: DiagnosticInfo | null;
  onUserAdded: () => void;
}

const UserManagementHeader = ({ usersCount, diagnosticInfo, onUserAdded }: UserManagementHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <p className="text-gray-600 mt-1">
          {usersCount > 0 ? (
            <>
              Managing {usersCount} users
              {diagnosticInfo && (
                <span className="ml-2 text-sm">
                  (Admin: {diagnosticInfo.roleCounts.admin || 0}, 
                  Student: {diagnosticInfo.roleCounts.student || 0}, 
                  Client: {diagnosticInfo.roleCounts.client || 0}, 
                  Free: {diagnosticInfo.roleCounts.free || 0})
                </span>
              )}
            </>
          ) : (
            "No users found"
          )}
        </p>
      </div>
      
      <AddUserDialog onUserAdded={onUserAdded} />
    </div>
  );
};

export default UserManagementHeader;
