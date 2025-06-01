
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Play, FileText, GripVertical, Clock, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/integrations/supabase/types";

type Unit = Tables<'units'>;
type Quiz = Tables<'quizzes'>;

interface UnitWithQuizzes extends Unit {
  quizzes: Quiz[];
}

interface UnitTreeNodeProps {
  unit: UnitWithQuizzes;
}

const UnitTreeNode = ({ unit }: UnitTreeNodeProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: unit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="bg-green-50 border-green-200 hover:shadow-sm transition-shadow">
        <CardContent className="p-2">
          <div className="flex items-center space-x-2">
            <div
              {...attributes}
              {...listeners}
              className="flex items-center text-gray-400 hover:text-gray-600 cursor-grab"
            >
              <GripVertical className="h-3 w-3" />
            </div>
            
            {unit.video_url ? (
              <Play className="h-3 w-3 text-green-600 flex-shrink-0" />
            ) : (
              <FileText className="h-3 w-3 text-green-600 flex-shrink-0" />
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h5 className="text-sm font-medium text-green-900 truncate">
                  {unit.title}
                </h5>
                
                {unit.duration_minutes && (
                  <div className="flex items-center space-x-1">
                    <Clock className="h-2 w-2 text-green-600" />
                    <span className="text-xs text-green-600">
                      {unit.duration_minutes}m
                    </span>
                  </div>
                )}
                
                {unit.video_url && (
                  <Badge variant="outline" className="text-xs">
                    Video
                  </Badge>
                )}
              </div>
              
              {unit.description && (
                <p className="text-xs text-green-700 mt-1 truncate">
                  {unit.description}
                </p>
              )}
              
              {unit.quizzes && unit.quizzes.length > 0 && (
                <div className="mt-1 space-y-1">
                  {unit.quizzes.map((quiz) => (
                    <div key={quiz.id} className="flex items-center space-x-2 ml-4">
                      <HelpCircle className="h-2 w-2 text-orange-500" />
                      <span className="text-xs text-orange-700 truncate">
                        Quiz: {quiz.title}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {quiz.passing_score}% pass
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnitTreeNode;
