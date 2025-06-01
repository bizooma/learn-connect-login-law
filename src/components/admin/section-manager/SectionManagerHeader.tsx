
import { Button } from "@/components/ui/button";
import { Plus, Video, FileText } from "lucide-react";

interface SectionManagerHeaderProps {
  onAddSection: (e: React.MouseEvent) => void;
  onAddUnit: (e: React.MouseEvent) => void;
  onAddVideo: (e: React.MouseEvent) => void;
}

const SectionManagerHeader = ({ onAddSection, onAddUnit }: SectionManagerHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold">Course Sections</h3>
      <div className="flex gap-2">
        <Button onClick={onAddSection} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
        <Button onClick={onAddUnit} variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Add Unit
        </Button>
      </div>
    </div>
  );
};

export default SectionManagerHeader;
