
import { Button } from "@/components/ui/button";
import { Users, RefreshCw } from "lucide-react";

interface EmptyUserStateProps {
  diagnosticInfo: any;
  onRefresh: () => void;
}

const EmptyUserState = ({ onRefresh }: EmptyUserStateProps) => {
  return (
    <div className="text-center py-12">
      <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
      <p className="text-gray-500 mb-6">
        Get started by adding your first user to the system.
      </p>
      <Button onClick={onRefresh} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh
      </Button>
    </div>
  );
};

export default EmptyUserState;
