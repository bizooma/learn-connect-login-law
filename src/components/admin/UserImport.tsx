
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import CSVFileUpload from "./user-import/CSVFileUpload";
import CSVPreview from "./user-import/CSVPreview";
import ImportResults from "./user-import/ImportResults";

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
      console.log('Starting import process...');
      
      const formData = new FormData();
      formData.append('file', file);

      console.log('Calling import function...');
      
      // Add timeout to prevent hanging
      const importPromise = supabase.functions.invoke('import-users-csv', {
        body: formData
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Import request timeout')), 120000) // 2 minutes
      );
      
      const { data, error } = await Promise.race([importPromise, timeoutPromise]) as any;

      console.log('Import response received:', { data, error });

      if (error) {
        console.error('Import error:', error);
        throw new Error(error.message || 'Import request failed');
      }

      if (!data) {
        throw new Error('No response data received');
      }

      if (data.success) {
        setImportResult(data.stats);
        toast({
          title: "Import completed",
          description: `Successfully imported ${data.stats.successfulImports} users`,
        });
      } else {
        console.error('Import failed:', data.error);
        toast({
          title: "Import failed",
          description: data.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to import users';
      toast({
        title: "Import failed",
        description: errorMessage,
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
          <CSVFileUpload onFileSelect={handleFileSelect} />

          <CSVPreview csvPreview={csvPreview} />

          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full"
          >
            {importing ? "Importing... (this may take a few minutes)" : "Import Users"}
          </Button>
        </CardContent>
      </Card>

      {importResult && (
        <ImportResults 
          importResult={importResult} 
          onDownloadErrorReport={downloadErrorReport}
        />
      )}
    </div>
  );
};

export default UserImport;
