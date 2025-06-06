
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Play, ChevronDown, ChevronRight, BookOpen, CheckCircle2 } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { useState } from "react";
import { useUnitProgress } from "@/hooks/useUnitProgress";
import CourseProgressBar from "./CourseProgressBar";

type Lesson = Tables<'lessons'>;
type Unit = Tables<'units'>;
type Quiz = Tables<'quizzes'>;

interface UnitWithQuiz extends Unit {
  quiz?: Quiz;
}

interface LessonWithUnits extends Lesson {
  units: UnitWithQuiz[];
}

interface CourseSidebarProps {
  courseId: string;
  lessons: LessonWithUnits[];
  selectedUnit: UnitWithQuiz | null;
  onUnitSelect: (unit: UnitWithQuiz) => void;
}

const CourseSidebar = ({ courseId, lessons, selectedUnit, onUnitSelect }: CourseSidebarProps) => {
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const { isUnitCompleted, loading: progressLoading } = useUnitProgress(courseId);

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
    <div className="space-y-4">
      <CourseProgressBar courseId={courseId} lessons={lessons} />
      
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Course Content</h3>
        <div className="text-sm text-gray-500">
          {lessons.length} modules
        </div>
      </div>
      
      <div className="space-y-3">
        {lessons.map((lesson, lessonIndex) => {
          const totalMinutes = lesson.units.reduce((acc, unit) => acc + (unit.duration_minutes || 0), 0);
          const isExpanded = expandedLessons.has(lesson.id);
          
          return (
            <Card key={lesson.id} className="overflow-hidden">
              <CardHeader 
                className="pb-2 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleLesson(lesson.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2 flex-1">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 mt-1 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mt-1 shrink-0" />
                    )}
                    <CardTitle className="text-sm font-medium line-clamp-2 pr-2">
                      {lesson.title}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="ml-2 shrink-0">
                    {lesson.units.length} units
                  </Badge>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="pt-0">
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                    {lesson.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {totalMinutes} minutes
                    </div>
                    <div className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      0 students
                    </div>
                  </div>
                  
                  {/* Units List */}
                  <div className="space-y-1">
                    {lesson.units.map((unit, unitIndex) => {
                      const isCompleted = !progressLoading && isUnitCompleted(unit.id);
                      const isSelected = selectedUnit?.id === unit.id;
                      
                      return (
                        <button
                          key={unit.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnitSelect(unit);
                          }}
                          className={`w-full text-left p-2 rounded hover:bg-gray-100 transition-colors border-l-2 ${
                            isSelected
                              ? 'border-l-blue-500 bg-blue-50'
                              : 'border-l-transparent'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {isCompleted ? (
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                              ) : (
                                <Play className="h-3 w-3 text-gray-400" />
                              )}
                              <span className={`text-xs font-medium ${isCompleted ? 'text-green-700' : ''}`}>
                                {unitIndex + 1}. {unit.title}
                              </span>
                              {unit.quiz && (
                                <BookOpen className="h-3 w-3 text-blue-600" />
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              {isCompleted && (
                                <Badge variant="outline" className="text-xs px-1 py-0 bg-green-50 text-green-700 border-green-200">
                                  ✓
                                </Badge>
                              )}
                              {unit.duration_minutes && (
                                <Badge variant="outline" className="text-xs px-1 py-0">
                                  {unit.duration_minutes}m
                                </Badge>
                              )}
                            </div>
                          </div>
                          {unit.description && (
                            <p className="text-xs text-gray-500 mt-1 truncate ml-5">
                              {unit.description}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
      
      {lessons.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <p>No modules available</p>
        </div>
      )}
    </div>
  );
};

export default CourseSidebar;
