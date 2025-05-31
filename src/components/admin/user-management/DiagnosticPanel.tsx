
import { Button } from "@/components/ui/button";
import { DiagnosticInfo } from "./types";

interface DiagnosticPanelProps {
  diagnosticInfo: DiagnosticInfo | null;
  isAdmin: boolean;
  isCleaningUp: boolean;
  onCleanupOrphanedRoles: () => void;
  onCreateMissingProfiles: () => void;
}

const DiagnosticPanel = ({ 
  diagnosticInfo, 
  isAdmin, 
  isCleaningUp, 
  onCleanupOrphanedRoles, 
  onCreateMissingProfiles 
}: DiagnosticPanelProps) => {
  if (!diagnosticInfo) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h3 className="font-semibold text-yellow-800 mb-2">📊 Database Analysis</h3>
      <div className="text-sm text-yellow-700 space-y-2">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="font-medium">Users with roles: {diagnosticInfo.rolesCount}</p>
            <p className="font-medium">Auth Users: {diagnosticInfo.authUsersCount}</p>
          </div>
          <div>
            <p className="font-medium">Role Distribution:</p>
            {Object.entries(diagnosticInfo.roleCounts).map(([role, count]) => (
              <p key={role} className="text-xs">• {role}: {count}</p>
            ))}
          </div>
          <div>
            <p className="font-medium">Issues Found:</p>
            <p className="text-xs">• Orphaned roles: {diagnosticInfo.orphanedRolesCount}</p>
            <p className="text-xs">• Missing profiles: {diagnosticInfo.missingProfilesCount}</p>
          </div>
        </div>
        
        {diagnosticInfo.orphanedRolesCount > 0 && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-600 font-medium">⚠️ Found {diagnosticInfo.orphanedRolesCount} orphaned roles</p>
            <p className="text-xs text-red-500 mt-1">These are roles assigned to users that don't have profile records</p>
            {diagnosticInfo.orphanedRoleEmails && diagnosticInfo.orphanedRoleEmails.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium">Sample orphaned user emails:</p>
                <p className="text-xs">{diagnosticInfo.orphanedRoleEmails.join(', ')}</p>
              </div>
            )}
            {isAdmin && (
              <Button 
                onClick={onCleanupOrphanedRoles}
                disabled={isCleaningUp}
                variant="destructive"
                size="sm"
                className="mt-2"
              >
                {isCleaningUp ? 'Cleaning...' : 'Cleanup Orphaned Roles'}
              </Button>
            )}
          </div>
        )}

        {diagnosticInfo.missingProfilesCount > 0 && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-600 font-medium">ℹ️ Found {diagnosticInfo.missingProfilesCount} users without profiles</p>
            <p className="text-xs text-blue-500 mt-1">These are auth users that don't have corresponding profile records</p>
            {isAdmin && (
              <Button 
                onClick={onCreateMissingProfiles}
                size="sm"
                className="mt-2"
              >
                Create Missing Profiles
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagnosticPanel;
