
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ImportResult {
  success: boolean;
  totalRows: number;
  successfulImports: number;
  failedImports: number;
  duplicateEmails: number;
  errors: Array<{ row: number; email: string; error: string }>;
  batchId: string;
}

const UserImport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setImportResult(null);

    // Preview first few rows
    const text = await selectedFile.text();
    const lines = text.trim().split('\n').slice(0, 6); // First 6 rows including header
    const preview = lines.map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')));
    setCsvPreview(preview);
  };

  const handleImport = async () => {
    if (!file || !user) return;

    setImporting(true);
    try {
      const csvData = await file.text();
      
      const { data, error } = await supabase.functions.invoke('import-users-csv', {
        body: {
          csvData,
          filename: file.name
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      setImportResult(data);
      
      if (data.success) {
        toast({
          title: "Import completed",
          description: `Successfully imported ${data.successfulImports} users`,
        });
      } else {
        toast({
          title: "Import failed",
          description: data.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error.message || "Failed to import users",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadErrorReport = () => {
    if (!importResult?.errors.length) return;

    const csvContent = [
      ['Row', 'Email', 'Error'],
      ...importResult.errors.map(error => [
        error.row.toString(),
        error.email,
        error.error
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `import-errors-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Import Users from CSV
          </CardTitle>
          <CardDescription>
            Upload a CSV file to bulk import users. Expected format: Role, First Name, Last Name, Email Address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
            <p className="text-sm text-gray-500 mt-2">
              CSV should have 4 columns: role, First Name, Last Name, email address
            </p>
          </div>

          {csvPreview.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  CSV Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <tbody>
                      {csvPreview.map((row, index) => (
                        <tr key={index} className={index === 0 ? "bg-gray-50 font-medium" : ""}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="border border-gray-300 px-3 py-2 text-sm">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {csvPreview.length >= 6 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Showing first 5 rows + header. Total rows will be processed on import.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full"
          >
            {importing ? "Importing..." : "Import Users"}
          </Button>
        </CardContent>
      </Card>

      {importResult && (
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

            {importResult.errors.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 text-yellow-600" />
                    Import Errors ({importResult.errors.length})
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadErrorReport}
                  >
                    Download Error Report
                  </Button>
                </div>
                <div className="max-h-60 overflow-y-auto border rounded p-3">
                  {importResult.errors.slice(0, 10).map((error, index) => (
                    <div key={index} className="text-sm mb-2 p-2 bg-red-50 rounded">
                      <div className="font-medium text-red-800">
                        {error.email}
                      </div>
                      <div className="text-red-600">{error.error}</div>
                    </div>
                  ))}
                  {importResult.errors.length > 10 && (
                    <div className="text-sm text-gray-500 text-center mt-2">
                      And {importResult.errors.length - 10} more errors...
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserImport;
