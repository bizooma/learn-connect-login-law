
import { DiagnosticInfo } from "./types";

interface EmptyUserStateProps {
  diagnosticInfo: DiagnosticInfo | null;
  onRefresh: () => void;
}

const EmptyUserState = ({ diagnosticInfo, onRefresh }: EmptyUserStateProps) => {
  return (
    <div className="text-center py-8">
      <p className="text-gray-500 mb-2">No users found in the database</p>
      {diagnosticInfo && (
        <div className="text-xs text-gray-400 mb-4">
          Database shows {diagnosticInfo.rolesCount} users with roles
          <br />
          {diagnosticInfo.authUsersCount} auth users detected
        </div>
      )}
      <button 
        onClick={onRefresh}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Refresh
      </button>
    </div>
  );
};

export default EmptyUserState;
