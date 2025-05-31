
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import ImportErrorsList from "./ImportErrorsList";

interface ImportResult {
  success: boolean;
  totalRows: number;
  successfulImports: number;
  failedImports: number;
  duplicateEmails: number;
  errors: Array<{ row: number; email: string; error: string }>;
  batchId: string;
}

interface ImportResultsProps {
  importResult: ImportResult;
  onDownloadErrorReport: () => void;
}

const ImportResults = ({ importResult, onDownloadErrorReport }: ImportResultsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {importResult.success ? (
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 mr-2 text-red-600" />
          )}
          Import Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {importResult.totalRows}
            </div>
            <div className="text-sm text-gray-600">Total Rows</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {importResult.successfulImports}
            </div>
            <div className="text-sm text-gray-600">Successful</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {importResult.failedImports}
            </div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {importResult.duplicateEmails}
            </div>
            <div className="text-sm text-gray-600">Duplicates</div>
          </div>
        </div>

        <ImportErrorsList 
          errors={importResult.errors} 
          onDownloadErrorReport={onDownloadErrorReport}
        />
      </CardContent>
    </Card>
  );
};

export default ImportResults;
