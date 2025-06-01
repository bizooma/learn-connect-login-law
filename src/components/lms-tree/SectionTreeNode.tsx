
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, FolderOpen, GripVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import UnitTreeNode from "./UnitTreeNode";

type Section = Tables<'sections'>;
type Unit = Tables<'units'>;
type Quiz = Tables<'quizzes'>;

interface SectionWithUnits extends Section {
  units: (Unit & {
    quizzes: Quiz[];
  })[];
}

interface SectionTreeNodeProps {
  section: SectionWithUnits;
  isExpanded: boolean;
  onToggle: () => void;
}

const SectionTreeNode = ({ section, isExpanded, onToggle }: SectionTreeNodeProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: `section-${section.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const totalQuizzes = section.units?.reduce((acc, unit) => 
    acc + (unit.quizzes?.length || 0), 0
  ) || 0;

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="bg-teal-50 border-teal-200 hover:shadow-sm transition-shadow border-l-4 border-l-teal-500">
        <CardContent className="p-3">
          <div className="flex items-center space-x-3">
            <div
              {...attributes}
              {...listeners}
              className="flex items-center text-gray-400 hover:text-gray-600 cursor-grab"
            >
              <GripVertical className="h-3 w-3" />
            </div>
            
            <button
              onClick={onToggle}
              className="flex items-center text-teal-600 hover:text-teal-800"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>

            <FolderOpen className="h-4 w-4 text-teal-600 flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <h4 className="font-medium text-teal-900 truncate">
                  {section.title}
                </h4>
                <span className="text-xs text-teal-600">
                  {section.units?.length || 0} units
                </span>
                {totalQuizzes > 0 && (
                  <span className="text-xs text-teal-600">
                    {totalQuizzes} quizzes
                  </span>
                )}
              </div>
              
              {section.description && (
                <p className="text-xs text-teal-700 mt-1 truncate">
                  {section.description}
                </p>
              )}
            </div>
          </div>

          {isExpanded && section.units && section.units.length > 0 && (
            <div className="ml-6 mt-3 space-y-1">
              {section.units.map((unit) => (
                <UnitTreeNode key={unit.id} unit={unit} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SectionTreeNode;
