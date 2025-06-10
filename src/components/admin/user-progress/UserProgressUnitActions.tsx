
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, CheckCircle, RotateCcw } from "lucide-react";
import AdminUnitCompletionDialog from "../progress-management/AdminUnitCompletionDialog";

interface UnitProgress {
  unit_id: string;
  unit_title: string;
  completed: boolean;
  completion_method: string | null;
  completed_at: string | null;
}

interface UserProgressUnitActionsProps {
  userId: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  units: UnitProgress[];
  onRefresh?: () => void;
}

const UserProgressUnitActions = ({
  userId,
  userName,
  courseId,
  courseTitle,
  units,
  onRefresh
}: UserProgressUnitActionsProps) => {
  const [selectedUnit, setSelectedUnit] = useState<UnitProgress | null>(null);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);

  const handleMarkUnitComplete = (unit: UnitProgress) => {
    setSelectedUnit(unit);
    setShowCompletionDialog(true);
  };

  const handleSuccess = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  const incompleteUnits = units.filter(unit => !unit.completed);
  const adminCompletedUnits = units.filter(unit => unit.completion_method === 'admin_override');

  if (units.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No units available in this course
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Unit Progress Actions</h4>
        <div className="text-sm text-gray-600">
          {units.filter(u => u.completed).length} / {units.length} units completed
        </div>
      </div>

      {incompleteUnits.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-700">Incomplete Units</h5>
          <div className="space-y-1">
            {incompleteUnits.map((unit) => (
              <div key={unit.unit_id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex-1">
                  <span className="text-sm">{unit.unit_title}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleMarkUnitComplete(unit)}
                  className="ml-2"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark Complete
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {adminCompletedUnits.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-700">Admin Completed Units</h5>
          <div className="space-y-1">
            {adminCompletedUnits.map((unit) => (
              <div key={unit.unit_id} className="flex items-center justify-between p-2 border rounded bg-orange-50">
                <div className="flex-1">
                  <span className="text-sm">{unit.unit_title}</span>
                  <div className="text-xs text-orange-600">
                    Admin override on {new Date(unit.completed_at!).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-xs text-orange-600 font-medium">
                  Admin Override
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {incompleteUnits.length === 0 && adminCompletedUnits.length === 0 && (
        <div className="text-center py-4 text-green-600">
          <CheckCircle className="h-8 w-8 mx-auto mb-2" />
          All units completed naturally by the student
        </div>
      )}

      <AdminUnitCompletionDialog
        open={showCompletionDialog}
        onOpenChange={setShowCompletionDialog}
        userId={userId}
        unitId={selectedUnit?.unit_id || ""}
        courseId={courseId}
        unitTitle={selectedUnit?.unit_title || ""}
        userName={userName}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default UserProgressUnitActions;
