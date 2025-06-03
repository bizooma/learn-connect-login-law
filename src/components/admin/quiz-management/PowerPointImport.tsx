
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Presentation } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface PowerPointImportProps {
  onImportComplete: (importData: any) => void;
}

const PowerPointImport = ({ onImportComplete }: PowerPointImportProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type - support both .ppt and .pptx
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.ms-powerpoint' // .ppt
    ];
    
    const fileName = selectedFile.name.toLowerCase();
    const hasValidExtension = fileName.endsWith('.pptx') || fileName.endsWith('.ppt');
    const hasValidMimeType = validTypes.includes(selectedFile.type);
    
    if (!hasValidExtension && !hasValidMimeType) {
      toast({
        title: "Invalid file type",
        description: "Please select a PowerPoint file (.pptx or .ppt)",
        variant: "destructive",
      });
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) { // 50MB limit
      toast({
        title: "File too large",
        description: "PowerPoint file must be less than 50MB",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleUploadAndProcess = async () => {
    if (!file || !user) return;

    setUploading(true);
    try {
      // Create import record
      const { data: importRecord, error: importError } = await supabase
        .from('powerpoint_imports')
        .insert({
          user_id: user.id,
          filename: file.name,
          file_url: '', // Will be updated after upload
          status: 'uploading'
        })
        .select()
        .single();

      if (importError) throw importError;

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${importRecord.id}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('powerpoint-imports')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Update import record with file URL
      const { error: updateError } = await supabase
        .from('powerpoint_imports')
        .update({ file_url: fileName })
        .eq('id', importRecord.id);

      if (updateError) throw updateError;

      setUploading(false);
      setProcessing(true);

      // Process the PowerPoint file
      const { data: processResult, error: processError } = await supabase.functions
        .invoke('process-powerpoint-quiz', {
          body: { importId: importRecord.id }
        });

      if (processError) throw processError;

      if (processResult.success) {
        toast({
          title: "Import successful",
          description: `Successfully analyzed ${processResult.data.questions.length} questions from your PowerPoint slides`,
        });
        onImportComplete(processResult.data);
      } else {
        throw new Error('Processing failed');
      }

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProcessing(false);
      setFile(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Presentation className="h-5 w-5 mr-2" />
          Import Quiz from PowerPoint
        </CardTitle>
        <CardDescription>
          Upload a PowerPoint presentation (.pptx or .ppt) and our AI will extract quiz questions from each slide's content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          {!file ? (
            <div>
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <label htmlFor="powerpoint-upload" className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-500">Choose a PowerPoint file</span>
                <span className="text-gray-500"> or drag and drop</span>
              </label>
              <input
                id="powerpoint-upload"
                type="file"
                accept=".pptx,.ppt,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint"
                onChange={handleFileSelect}
                className="hidden"
              />
              <p className="text-xs text-gray-500 mt-2">
                Supports .pptx and .ppt files up to 50MB
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <span className="font-medium">{file.name}</span>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          )}
        </div>

        {file && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How the AI Quiz Generation Works:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Slide Analysis:</strong> AI examines each slide's content individually</li>
              <li>• <strong>Question Creation:</strong> Content from each slide becomes the correct answer</li>
              <li>• <strong>Multiple Choice:</strong> AI generates 3 plausible incorrect options per question</li>
              <li>• <strong>Context Preservation:</strong> Questions are linked to their source slides</li>
              <li>• <strong>Review & Edit:</strong> You can modify questions before creating the quiz</li>
            </ul>
            <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-700">
              <strong>Example:</strong> If a slide contains "Form I-485 is used for adjustment of status", 
              the AI creates: "Which form is used for adjustment of status?" with I-485 as the correct answer.
            </div>
          </div>
        )}

        <Button
          onClick={handleUploadAndProcess}
          disabled={!file || uploading || processing}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading PowerPoint...
            </>
          ) : processing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              AI Analyzing Slides & Generating Questions...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Generate Quiz from PowerPoint
            </>
          )}
        </Button>

        {(uploading || processing) && (
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <AlertCircle className="h-4 w-4" />
              <span>
                {uploading ? 'Uploading your PowerPoint file...' : 'AI is analyzing each slide and creating targeted quiz questions...'}
              </span>
            </div>
            {processing && (
              <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800">
                <strong>Processing Steps:</strong>
                <div className="mt-1 space-y-1">
                  <div>✓ File uploaded successfully</div>
                  <div>🔄 Extracting content from slides...</div>
                  <div>🔄 Generating questions where slide content = correct answers...</div>
                  <div>🔄 Creating multiple choice options...</div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PowerPointImport;
