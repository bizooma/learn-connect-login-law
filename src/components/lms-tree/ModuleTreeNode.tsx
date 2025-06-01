
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, Package, GripVertical, FolderOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import SectionTreeNode from "./SectionTreeNode";

type Module = Tables<'modules'>;
type Section = Tables<'sections'>;
type Unit = Tables<'units'>;
type Quiz = Tables<'quizzes'>;

interface ModuleWithSections extends Module {
  sections: (Section & {
    units: (Unit & {
      quizzes: Quiz[];
    })[];
  })[];
}

interface ModuleTreeNodeProps {
  module: ModuleWithSections;
  isExpanded: boolean;
  onToggle: () => void;
  expandedSections: Set<string>;
  onToggleSection: (sectionId: string) => void;
}

const ModuleTreeNode = ({
  module,
  isExpanded,
  onToggle,
  expandedSections,
  onToggleSection
}: ModuleTreeNodeProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: `module-${module.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const totalUnits = module.sections?.reduce((acc, section) => 
    acc + (section.units?.length || 0), 0
  ) || 0;

  const totalQuizzes = module.sections?.reduce((acc, section) => 
    acc + (section.units?.reduce((unitAcc, unit) => 
      unitAcc + (unit.quizzes?.length || 0), 0
    ) || 0), 0
  ) || 0;

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="bg-purple-50 border-purple-200 hover:shadow-sm transition-shadow border-l-4 border-l-purple-500">
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
              className="flex items-center text-purple-600 hover:text-purple-800"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>

            <Package className="h-4 w-4 text-purple-600 flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <h4 className="font-medium text-purple-900 truncate">
                  {module.title}
                </h4>
                <span className="text-xs text-purple-600">
                  {module.sections?.length || 0} sections
                </span>
                {totalUnits > 0 && (
                  <span className="text-xs text-purple-600">
                    {totalUnits} units
                  </span>
                )}
                {totalQuizzes > 0 && (
                  <span className="text-xs text-purple-600">
                    {totalQuizzes} quizzes
                  </span>
                )}
              </div>
              
              {module.description && (
                <p className="text-xs text-purple-700 mt-1 truncate">
                  {module.description}
                </p>
              )}
            </div>
          </div>

          {isExpanded && module.sections && module.sections.length > 0 && (
            <div className="ml-6 mt-3 space-y-1">
              {module.sections.map((section) => (
                <SectionTreeNode
                  key={section.id}
                  section={section}
                  isExpanded={expandedSections.has(section.id)}
                  onToggle={() => onToggleSection(section.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ModuleTreeNode;
