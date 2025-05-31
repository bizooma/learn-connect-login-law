
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ImportError {
  row: number;
  email: string;
  error: string;
}

interface ImportErrorsListProps {
  errors: ImportError[];
  onDownloadErrorReport: () => void;
}

const ImportErrorsList = ({ errors, onDownloadErrorReport }: ImportErrorsListProps) => {
  if (errors.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium flex items-center">
          <AlertCircle className="h-4 w-4 mr-2 text-yellow-600" />
          Import Errors ({errors.length})
        </h4>
        <Button
          variant="outline"
          size="sm"
          onClick={onDownloadErrorReport}
        >
          Download Error Report
        </Button>
      </div>
      <div className="max-h-60 overflow-y-auto border rounded p-3">
        {errors.slice(0, 10).map((error, index) => (
          <div key={index} className="text-sm mb-2 p-2 bg-red-50 rounded">
            <div className="font-medium text-red-800">
              {error.email}
            </div>
            <div className="text-red-600">{error.error}</div>
          </div>
        ))}
        {errors.length > 10 && (
          <div className="text-sm text-gray-500 text-center mt-2">
            And {errors.length - 10} more errors...
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportErrorsList;
