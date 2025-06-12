
import { Button } from "@/components/ui/button";
import { Plus, Users, RefreshCw } from "lucide-react";
import { SimplifiedUserStats } from "./simplifiedDataService";
import AddUserDialog from "./AddUserDialog";

interface SimplifiedUserManagementHeaderProps {
  stats: SimplifiedUserStats;
  onRefresh: () => void;
}

const SimplifiedUserManagementHeader = ({ 
  stats, 
  onRefresh 
}: SimplifiedUserManagementHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <Users className="h-6 w-6" />
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-gray-600">
            Managing {stats.totalUsers} users
            {Object.keys(stats.roleCounts).length > 0 && (
              <span className="ml-2">
                (Admin: {stats.roleCounts.admin || 0}, 
                Student: {stats.roleCounts.student || 0}, 
                Client: {stats.roleCounts.client || 0}, 
                Free: {stats.roleCounts.free || 0}, 
                Owner: {stats.roleCounts.owner || 0}, 
                Team Leader: {stats.roleCounts.team_leader || 0})
              </span>
            )}
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button onClick={onRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <AddUserDialog onUserAdded={onRefresh} />
      </div>
    </div>
  );
};

export default SimplifiedUserManagementHeader;
