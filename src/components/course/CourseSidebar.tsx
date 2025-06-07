
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, BookOpen, PlayCircle, FileText } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Unit = Tables<'units'>;

interface UnitWithQuiz extends Omit<Unit, 'files'> {
  quiz?: {
    id: string;
    title: string;
    description: string;
    is_active: boolean;
  };
  files?: Array<{ url: string; name: string; size: number }>;
}

interface LessonWithUnits {
  id: string;
  title: string;
  description?: string;
  units: UnitWithQuiz[];
}

interface CourseSidebarProps {
  courseId: string;
  lessons: LessonWithUnits[];
  selectedUnit: UnitWithQuiz | null;
  onUnitSelect: (unit: UnitWithQuiz) => void;
}

const CourseSidebar = ({ lessons, selectedUnit, onUnitSelect }: CourseSidebarProps) => {
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

  const toggleLesson = (lessonId: string) => {
    const newExpanded = new Set(expandedLessons);
    if (newExpanded.has(lessonId)) {
      newExpanded.delete(lessonId);
    } else {
      newExpanded.add(lessonId);
    }
    setExpandedLessons(newExpanded);
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Course Content
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-2">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="border-b last:border-b-0">
              <Button
                variant="ghost"
                className="w-full justify-between p-4 h-auto"
                onClick={() => toggleLesson(lesson.id)}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <BookOpen className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium text-left break-words overflow-hidden">{lesson.title}</span>
                </div>
                {expandedLessons.has(lesson.id) ? (
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 flex-shrink-0" />
                )}
              </Button>
              
              {expandedLessons.has(lesson.id) && (
                <div className="pl-4 pb-2 space-y-1">
                  {lesson.units.map((unit) => (
                    <Button
                      key={unit.id}
                      variant={selectedUnit?.id === unit.id ? "secondary" : "ghost"}
                      className="w-full justify-start text-sm p-3 h-auto"
                      onClick={() => onUnitSelect(unit)}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {unit.video_url ? (
                          <PlayCircle className="h-4 w-4 flex-shrink-0" />
                        ) : (
                          <FileText className="h-4 w-4 flex-shrink-0" />
                        )}
                        <span className="text-left flex-1 break-words overflow-hidden">{unit.title}</span>
                        {unit.quiz?.is_active && (
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            Quiz
                          </Badge>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseSidebar;
