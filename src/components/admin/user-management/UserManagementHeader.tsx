
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Users, RefreshCw } from "lucide-react";
import { DiagnosticInfo } from "./types";
import AddUserDialog from "./AddUserDialog";

interface UserManagementHeaderProps {
  usersCount: number;
  diagnosticInfo: DiagnosticInfo | null;
  onUserAdded: () => void;
}

const UserManagementHeader = ({ 
  usersCount, 
  diagnosticInfo, 
  onUserAdded 
}: UserManagementHeaderProps) => {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleUserAdded = async () => {
    setShowAddDialog(false);
    // Refresh the users data
    await onUserAdded();
  };

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <Users className="h-6 w-6" />
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-gray-600">
            Managing {usersCount} users
            {diagnosticInfo && (
              <span className="ml-2">
                (Admin: {diagnosticInfo.roleCounts.admin || 0}, 
                Student: {diagnosticInfo.roleCounts.student || 0}, 
                Client: {diagnosticInfo.roleCounts.client || 0}, 
                Free: {diagnosticInfo.roleCounts.free || 0}, 
                Owner: {diagnosticInfo.roleCounts.owner || 0})
              </span>
            )}
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button onClick={() => onUserAdded()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>
      
      <AddUserDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onUserAdded={handleUserAdded}
      />
    </div>
  );
};

export default UserManagementHeader;
