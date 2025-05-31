
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const SectionNotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Section Not Found</h1>
        <p className="text-gray-600 mb-8">The section you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    </div>
  );
};

export default SectionNotFound;
