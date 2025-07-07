
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Award, Loader2 } from "lucide-react";
import { logger } from "@/utils/logger";

interface CertificateDownloadProps {
  courseId: string;
  courseTitle: string;
  isCompleted: boolean;
  loading?: boolean;
}

const CertificateDownload = ({ courseId, courseTitle, isCompleted, loading = false }: CertificateDownloadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadCertificate = async () => {
    if (!user || !isCompleted) return;

    setIsDownloading(true);
    try {
      logger.log('Generating certificate for:', { courseId, userId: user.id });

      const { data, error } = await supabase.functions.invoke('generate-certificate', {
        body: { courseId, userId: user.id }
      });

      if (error) throw error;

      // The response should be a blob/arrayBuffer for the certificate image
      const blob = new Blob([data], { type: 'image/png' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${courseTitle.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Certificate Downloaded",
        description: "Your certificate has been downloaded successfully!",
      });

    } catch (error) {
      logger.error('Error downloading certificate:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download certificate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-600">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Checking Course Status...
          </CardTitle>
          <CardDescription>
            Please wait while we verify your course completion
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!isCompleted) {
    return (
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-600">
            <Award className="h-5 w-5 mr-2" />
            Certificate of Completion
          </CardTitle>
          <CardDescription>
            Complete this course to earn your certificate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled variant="outline" className="w-full">
            <Award className="h-4 w-4 mr-2" />
            Certificate Not Available
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-900">
          <Award className="h-5 w-5 mr-2" />
          Certificate of Completion
        </CardTitle>
        <CardDescription>
          Congratulations! You have successfully completed this course.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleDownloadCertificate}
          disabled={isDownloading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isDownloading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Certificate...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download Certificate
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CertificateDownload;
