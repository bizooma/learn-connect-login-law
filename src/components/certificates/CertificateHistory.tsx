
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Award, Calendar, Hash } from "lucide-react";
import { useCertificates } from "@/hooks/useCertificates";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const CertificateHistory = () => {
  const { certificates, loading, error } = useCertificates();
  const { user } = useAuth();
  const { toast } = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadCertificate = async (courseId: string, courseTitle: string, certificateNumber: string) => {
    if (!user) return;

    setDownloadingId(courseId);
    try {
      console.log('Downloading certificate for:', { courseId, userId: user.id });

      const { data, error } = await supabase.functions.invoke('generate-certificate', {
        body: { courseId, userId: user.id }
      });

      if (error) throw error;

      // The response should be a blob/arrayBuffer for the certificate image
      const blob = new Blob([data], { type: 'image/png' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certificateNumber}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Certificate Downloaded",
        description: "Your certificate has been downloaded successfully!",
      });

    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download certificate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Certificate History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Certificate History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (certificates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Certificate History
          </CardTitle>
          <CardDescription>
            Your earned certificates will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Award className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No certificates earned yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Complete courses to earn your first certificate!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Award className="h-5 w-5 mr-2" />
          Certificate History
        </CardTitle>
        <CardDescription>
          Download and manage your earned certificates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {certificates.map((certificate) => (
            <div
              key={certificate.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <h3 className="font-medium text-lg">{certificate.course_title}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Awarded to: {certificate.recipient_name}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(certificate.issued_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="flex items-center">
                    <Hash className="h-4 w-4 mr-1" />
                    {certificate.certificate_number}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Earned
                </Badge>
                <Button
                  onClick={() => handleDownloadCertificate(
                    certificate.course_id,
                    certificate.course_title,
                    certificate.certificate_number
                  )}
                  disabled={downloadingId === certificate.course_id}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {downloadingId === certificate.course_id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CertificateHistory;
