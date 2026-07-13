import { useParams } from "react-router-dom";
import HubHeader from "@/components/hub/HubHeader";
import DepartmentGrid from "@/components/hub/DepartmentGrid";
import DepartmentDetail from "@/components/hub/DepartmentDetail";
import { getDepartment } from "@/config/hub";

const Hub = () => {
  const { departmentId } = useParams<{ departmentId?: string }>();
  const dept = departmentId ? getDepartment(departmentId) : undefined;

  return (
    <div className="min-h-screen bg-background">
      <HubHeader subtitle={dept ? dept.name : undefined} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {departmentId ? <DepartmentDetail /> : <DepartmentGrid />}
      </main>
    </div>
  );
};

export default Hub;
