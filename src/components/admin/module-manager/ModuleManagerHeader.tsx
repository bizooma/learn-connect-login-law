
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

interface ModuleManagerHeaderProps {
  onAddModule: (e: React.MouseEvent) => void;
}

const ModuleManagerHeader = ({ onAddModule }: ModuleManagerHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-lg font-semibold">Course Modules</h3>
        <p className="text-sm text-gray-600">Organize your course content into modules, lessons, and units</p>
      </div>
      <Button onClick={onAddModule} variant="outline" size="sm">
        <Package className="h-4 w-4 mr-2" />
        Add Module
      </Button>
    </div>
  );
};

export default ModuleManagerHeader;
