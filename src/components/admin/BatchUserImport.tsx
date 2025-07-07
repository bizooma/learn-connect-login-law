import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/utils/logger";

interface ImportResult {
  success: boolean;
  totalRows: number;
  successfulImports: number;
  failedImports: number;
  duplicateEmails: number;
  updatedUsers: number;
  errors: Array<{ row: number; email: string; error: string }>;
}

const BatchUserImport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [updateExisting, setUpdateExisting] = useState(false);

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
    setProgress(0);

    // Preview first few rows
    const text = await selectedFile.text();
    const lines = text.trim().split('\n').slice(0, 6);
    const preview = lines.map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')));
    setCsvPreview(preview);
  };

  const handleBatchImport = async () => {
    if (!file || !user) return;

    setImporting(true);
    setProgress(0);
    
    try {
      logger.log('Starting batch import process...');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('updateExisting', updateExisting.toString());

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const { data, error } = await supabase.functions.invoke('batch-import-users', {
        body: formData
      });

      clearInterval(progressInterval);
      setProgress(100);

      logger.log('Batch import response:', { data, error });

      if (error) {
        logger.error('Batch import error:', error);
        throw new Error(error.message || 'Import request failed');
      }

      if (!data) {
        throw new Error('No response data received');
      }

      if (data.success) {
        setImportResult(data.stats);
        const successMessage = updateExisting 
          ? `Import completed: ${data.stats.successfulImports} new users, ${data.stats.updatedUsers} updated users`
          : `Successfully imported ${data.stats.successfulImports} users`;
        
        toast({
          title: "Import completed",
          description: successMessage,
        });
      } else {
        logger.error('Batch import failed:', data.error);
        toast({
          title: "Import failed",
          description: data.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      logger.error('Batch import error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to import users';
      toast({
        title: "Import failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      setTimeout(() => setProgress(0), 2000);
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
            Batch Import Users from CSV
          </CardTitle>
          <CardDescription>
            Fast bulk import using batch processing. Expected format: Role, First Name, Last Name, Email Address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="w-full cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
            />
            <div className="text-sm text-gray-500 mt-2 space-y-1">
              <p>CSV should have 4 columns: role, First Name, Last Name, email address</p>
              <p className="text-blue-600">• Email address is required</p>
              <p className="text-blue-600">• Empty role defaults to 'student'</p>
              <p className="text-blue-600">• First Name and Last Name can be empty</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="updateExisting" 
              checked={updateExisting}
              onCheckedChange={(checked) => setUpdateExisting(checked as boolean)}
            />
            <label 
              htmlFor="updateExisting" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Update existing users (names and roles)
            </label>
          </div>

          {csvPreview.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">CSV Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <tbody>
                      {csvPreview.map((row, index) => (
                        <tr key={index} className={index === 0 ? "bg-gray-50 font-medium" : ""}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="border border-gray-300 px-3 py-2 text-sm">
                              {cell || (index > 0 ? <span className="text-gray-400 italic">empty</span> : cell)}
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

          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Import Progress</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          <Button
            onClick={handleBatchImport}
            disabled={!file || importing}
            className="w-full"
          >
            {importing ? "Processing batches..." : "Start Batch Import"}
          </Button>
        </CardContent>
      </Card>

      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {(importResult.successfulImports > 0 || importResult.updatedUsers > 0) ? (
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
              )}
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                <div className="text-sm text-gray-600">New Users</div>
              </div>
              {updateExisting && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {importResult.updatedUsers || 0}
                  </div>
                  <div className="text-sm text-gray-600">Updated</div>
                </div>
              )}
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
                <div className="text-sm text-gray-600">Skipped</div>
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
                        Row {error.row}: {error.email}
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

export default BatchUserImport;
