
import { Button } from "@/components/ui/button";
import { FileDown, Download } from "lucide-react";

interface UserProgressManagementHeaderProps {
  onExportCSV: () => void;
  onRefreshData: () => void;
  hasData: boolean;
}

const UserProgressManagementHeader = ({
  onExportCSV,
  onRefreshData,
  hasData
}: UserProgressManagementHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">User Progress Tracking</h2>
        <p className="text-gray-600">Monitor user course and unit completion progress</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onExportCSV} disabled={!hasData}>
          <FileDown className="h-4 w-4 mr-2" />
          Download CSV
        </Button>
        <Button variant="outline" onClick={onRefreshData}>
          <Download className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>
    </div>
  );
};

export default UserProgressManagementHeader;
