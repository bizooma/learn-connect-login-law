
import CertificateHistory from "@/components/certificates/CertificateHistory";

const StudentCertificatesTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Certificates</h2>
        <p className="text-gray-600">View and download your earned certificates</p>
      </div>
      
      <CertificateHistory />
    </div>
  );
};

export default StudentCertificatesTab;
