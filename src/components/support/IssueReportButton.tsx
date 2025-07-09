import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import IssueReportModal from "./IssueReportModal";

const IssueReportButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-md shadow-md transition-colors duration-200"
      >
        <AlertTriangle className="h-4 w-4 mr-2" />
        Report an Issue
      </Button>
      
      <IssueReportModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
};

export default IssueReportButton;