
import { Button } from "@/components/ui/button";
import { Plus, FileText, Package } from "lucide-react";

interface SimpleLessonManagerHeaderProps {
  onAddLesson: (e: React.MouseEvent) => void;
  onAddUnit: (e: React.MouseEvent) => void;
  onAddModule?: (e: React.MouseEvent) => void;
}

const SimpleLessonManagerHeader = ({ onAddLesson, onAddUnit, onAddModule }: SimpleLessonManagerHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold">Course Lessons</h3>
      <div className="flex gap-2">
        {onAddModule && (
          <Button onClick={onAddModule} variant="outline" size="sm">
            <Package className="h-4 w-4 mr-2" />
            Add Module
          </Button>
        )}
        <Button onClick={onAddLesson} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Lesson
        </Button>
        <Button onClick={onAddUnit} variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Add Unit
        </Button>
      </div>
    </div>
  );
};

export default SimpleLessonManagerHeader;
