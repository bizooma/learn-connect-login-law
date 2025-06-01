
import { Button } from "@/components/ui/button";
import { Plus, Video } from "lucide-react";

interface SectionManagerHeaderProps {
  onAddSection: (e: React.MouseEvent) => void;
  onAddUnit: (e: React.MouseEvent) => void;
  onAddVideo: (e: React.MouseEvent) => void;
}

const SectionManagerHeader = ({
  onAddSection,
  onAddUnit,
  onAddVideo,
}: SectionManagerHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">Course Sections</h3>
      <div className="flex items-center space-x-2">
        <Button 
          type="button"
          onClick={onAddSection} 
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
        <Button 
          type="button"
          onClick={onAddUnit} 
          size="sm" 
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Unit
        </Button>
        <Button 
          type="button"
          onClick={onAddVideo} 
          size="sm" 
          variant="outline"
        >
          <Video className="h-4 w-4 mr-2" />
          Add Video
        </Button>
      </div>
    </div>
  );
};

export default SectionManagerHeader;
