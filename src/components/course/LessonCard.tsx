
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

interface LessonCardProps {
  lesson: {
    id: string;
    title: string;
    description?: string;
    image_url?: string;
  };
}

const LessonCard = ({ lesson }: LessonCardProps) => {
  return (
    <Card className="mb-6 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Lesson Image */}
          <div className="md:w-1/3 h-48 md:h-auto">
            {lesson.image_url ? (
              <img
                src={lesson.image_url}
                alt={lesson.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <BookOpen className="h-16 w-16 text-blue-400" />
              </div>
            )}
          </div>
          
          {/* Lesson Content */}
          <div className="md:w-2/3 p-6">
            <div className="flex items-start gap-3">
              <BookOpen className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3 break-words">
                  {lesson.title}
                </h2>
                {lesson.description && (
                  <p className="text-gray-700 leading-relaxed break-words">
                    {lesson.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LessonCard;
