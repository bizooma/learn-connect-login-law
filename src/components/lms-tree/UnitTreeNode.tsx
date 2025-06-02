
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileText, Play, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";
import ReclassificationDropdown from "./ReclassificationDropdown";
import { useReorderOperations } from "./hooks/useReorderOperations";

type Unit = Tables<'units'>;
type Quiz = Tables<'quizzes'>;

interface UnitWithQuizzes extends Unit {
  quizzes: Quiz[];
}

interface UnitTreeNodeProps {
  unit: UnitWithQuizzes;
  availableTargets?: Array<{
    id: string;
    title: string;
    type: 'course' | 'module' | 'lesson';
  }>;
  onRefetch?: () => void;
}

const UnitTreeNode = ({ unit, availableTargets = [], onRefetch }: UnitTreeNodeProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: `unit-${unit.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const { reorderUnit } = useReorderOperations(onRefetch || (() => {}));

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="bg-orange-50 border-orange-200 hover:shadow-sm transition-shadow border-l-4 border-l-orange-500">
        <CardContent className="p-2">
          <div className="flex items-center space-x-2">
            <div
              {...attributes}
              {...listeners}
              className="flex items-center text-gray-400 hover:text-gray-600 cursor-grab"
            >
              <GripVertical className="h-3 w-3" />
            </div>

            {/* Reorder buttons */}
            <div className="flex flex-col space-y-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => reorderUnit(unit.id, 'up')}
                className="h-4 w-4 p-0 hover:bg-orange-100"
              >
                <ArrowUp className="h-2 w-2" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => reorderUnit(unit.id, 'down')}
                className="h-4 w-4 p-0 hover:bg-orange-100"
              >
                <ArrowDown className="h-2 w-2" />
              </Button>
            </div>

            {unit.video_url ? (
              <Play className="h-3 w-3 text-orange-600 flex-shrink-0" />
            ) : (
              <FileText className="h-3 w-3 text-orange-600 flex-shrink-0" />
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h5 className="text-sm font-medium text-orange-900 truncate">
                  {unit.title}
                </h5>
                {unit.duration_minutes && (
                  <Badge variant="secondary" className="text-xs">
                    {unit.duration_minutes}m
                  </Badge>
                )}
                {unit.quizzes && unit.quizzes.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {unit.quizzes.length} quiz{unit.quizzes.length !== 1 ? 'zes' : ''}
                  </Badge>
                )}
              </div>
              
              {unit.description && (
                <p className="text-xs text-orange-700 mt-1 truncate">
                  {unit.description}
                </p>
              )}
            </div>

            {onRefetch && (
              <ReclassificationDropdown
                itemId={unit.id}
                itemType="unit"
                itemTitle={unit.title}
                currentParentId={unit.section_id}
                availableTargets={availableTargets}
                onRefetch={onRefetch}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnitTreeNode;
