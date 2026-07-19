import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import HubHeader from "@/components/hub/HubHeader";
import DepartmentGrid from "@/components/hub/DepartmentGrid";
import DepartmentDetail from "@/components/hub/DepartmentDetail";
import LMSTreeFooter from "@/components/lms-tree/LMSTreeFooter";
import { Button } from "@/components/ui/button";
import { getDepartment } from "@/config/hub";

const Hub = () => {
  const { departmentId } = useParams<{ departmentId?: string }>();
  const navigate = useNavigate();
  const dept = departmentId ? getDepartment(departmentId) : undefined;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HubHeader subtitle={dept ? dept.name : undefined} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/admin")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Dashboard
          </Button>
        </div>
        {departmentId ? <DepartmentDetail /> : <DepartmentGrid />}
      </main>
      <LMSTreeFooter />
    </div>
  );
};

export default Hub;

