
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Edit, Trash2, Eye, Image } from "lucide-react";
import { getLevelColor, getLevelDisplayName } from "@/utils/courseUtils";
import { Tables } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import { useEnrollmentCounts } from "@/hooks/useEnrollmentCounts";

type Course = Tables<'courses'>;

interface AdminCourseCardProps {
  course: Course;
  onDelete: (courseId: string) => void;
  onEdit: (course: Course) => void;
  onStatusChange?: () => void;
}

const AdminCourseCard = ({ course, onDelete, onEdit, onStatusChange }: AdminCourseCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { enrollmentCounts } = useEnrollmentCounts(true); // Keep realtime for admin views
  const [isToggling, setIsToggling] = useState(false);

  const handleViewCourse = () => {
    navigate(`/course/${course.id}`);
  };

  const handleToggleStatus = async () => {
    setIsToggling(true);
    try {
      const newStatus = !course.is_draft;
      
      const { error } = await supabase
        .from('courses')
        .update({ is_draft: newStatus })
        .eq('id', course.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `Course ${newStatus ? 'set to draft' : 'published'} successfully`,
      });

      // Trigger refresh of the course list
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      logger.error('Error updating course status:', error);
      toast({
        title: "Error",
        description: "Failed to update course status",
        variant: "destructive",
      });
    } finally {
      setIsToggling(false);
    }
  };

  // Get actual enrollment count
  const enrollmentCount = enrollmentCounts[course.id] || 0;

  return (
    <Card className={`hover:shadow-md transition-shadow ${course.is_draft ? 'bg-gray-50 border-dashed' : 'bg-white'}`}>
      {/* Course Image Section */}
      <div className="relative h-40 w-full overflow-hidden rounded-t-lg">
        {course.image_url ? (
          <img
            src={course.image_url}
            alt={course.title}
            className={`h-full w-full object-cover ${course.is_draft ? 'opacity-70' : ''}`}
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center ${course.is_draft ? 'opacity-70' : ''}`}>
            <Image className="h-12 w-12 text-gray-400" />
          </div>
        )}
        {/* Status and Level Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {course.level && (
            <Badge className={getLevelColor(course.level)}>
              {getLevelDisplayName(course.level)}
            </Badge>
          )}
          <Badge variant={course.is_draft ? "secondary" : "default"} className={course.is_draft ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>
            {course.is_draft ? "Draft" : "Published"}
          </Badge>
        </div>
      </div>

      {/* Content Section */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className={`text-lg line-clamp-2 mb-1 ${course.is_draft ? 'text-gray-600' : ''}`}>
              {course.title}
            </CardTitle>
            <p className={`text-sm font-medium ${course.is_draft ? 'text-gray-500' : 'text-gray-600'}`}>
              by {course.instructor}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className={`text-sm line-clamp-2 mb-3 ${course.is_draft ? 'text-gray-500' : 'text-gray-600'}`}>
          {course.description}
        </p>
        
        <div className={`flex items-center justify-between text-sm mb-4 ${course.is_draft ? 'text-gray-500' : 'text-gray-600'}`}>
          <span>{course.duration}</span>
          <span>{enrollmentCount} students</span>
          <span>★ {course.rating || 0}</span>
        </div>

        {/* Status Toggle */}
        <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">
            {course.is_draft ? "Draft" : "Published"}
          </span>
          <Switch
            checked={!course.is_draft}
            onCheckedChange={handleToggleStatus}
            disabled={isToggling}
            aria-label="Toggle course status"
          />
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="secondary">{course.category}</Badge>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleViewCourse}
              className="border-blue-500 text-blue-500 hover:bg-blue-50"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onEdit(course)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onDelete(course.id)}
              className="border-red-500 text-red-500 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminCourseCard;
