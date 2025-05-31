
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
      </div>
    </div>
  );
};

export default UserManagementHeader;
