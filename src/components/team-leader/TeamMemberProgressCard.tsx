
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { User, BookOpen, Trophy, Clock, Eye } from "lucide-react";
import { TeamMember } from "@/hooks/useTeamMembers";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

interface TeamMemberProgressCardProps {
  member: TeamMember;
  onViewProgress: (userId: string) => void;
}

interface MemberProgress {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  overallProgress: number;
}

const TeamMemberProgressCard = ({ member, onViewProgress }: TeamMemberProgressCardProps) => {
  const [progress, setProgress] = useState<MemberProgress>({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    overallProgress: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemberProgress = async () => {
      try {
        setLoading(true);
        logger.log('📊 Fetching progress for member:', member.email);

        // Get course assignments and progress for this member
        const { data: assignments, error: assignmentsError } = await supabase
          .from('course_assignments')
          .select('course_id')
          .eq('user_id', member.id);

        if (assignmentsError) {
          logger.error('❌ Error fetching assignments:', assignmentsError);
          return;
        }

        if (!assignments || assignments.length === 0) {
          logger.log('📝 No assignments found for member:', member.email);
          setProgress({
            totalCourses: 0,
            completedCourses: 0,
            inProgressCourses: 0,
            overallProgress: 0
          });
          return;
        }

        const courseIds = assignments.map(a => a.course_id);
        
        // Get progress for assigned courses
        const { data: courseProgress, error: progressError } = await supabase
          .from('user_course_progress')
          .select('status, progress_percentage')
          .eq('user_id', member.id)
          .in('course_id', courseIds);

        if (progressError) {
          logger.error('❌ Error fetching progress:', progressError);
          return;
        }

        const totalCourses = assignments.length;
        const completedCourses = courseProgress?.filter(p => p.status === 'completed').length || 0;
        const inProgressCourses = courseProgress?.filter(p => p.status === 'in_progress').length || 0;
        
        // Calculate overall progress as average of all course progress percentages
        const overallProgress = courseProgress && courseProgress.length > 0
          ? Math.round(courseProgress.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / courseProgress.length)
          : 0;

        logger.log('📈 Member progress calculated:', {
          member: member.email,
          totalCourses,
          completedCourses,
          inProgressCourses,
          overallProgress
        });

        setProgress({
          totalCourses,
          completedCourses,
          inProgressCourses,
          overallProgress
        });

      } catch (error) {
        logger.error('❌ Error calculating member progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberProgress();
  }, [member.id, member.email]);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              {member.profile_image_url ? (
                <img 
                  src={member.profile_image_url} 
                  alt={`${member.first_name} ${member.last_name}`}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">
                {member.first_name} {member.last_name}
              </CardTitle>
              <p className="text-sm text-gray-600">{member.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {member.roles?.map((role) => (
              <Badge key={role} variant="outline" className="text-xs">
                {role}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Progress Overview */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{progress.overallProgress}%</span>
              </div>
              <Progress value={progress.overallProgress} className="h-2" />
            </div>

            {/* Course Statistics */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="space-y-1">
                <div className="flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-blue-600 mr-1" />
                  <span className="text-lg font-semibold">{progress.totalCourses}</span>
                </div>
                <p className="text-xs text-gray-600">Assigned</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-center">
                  <Clock className="h-4 w-4 text-orange-600 mr-1" />
                  <span className="text-lg font-semibold">{progress.inProgressCourses}</span>
                </div>
                <p className="text-xs text-gray-600">In Progress</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-lg font-semibold">{progress.completedCourses}</span>
                </div>
                <p className="text-xs text-gray-600">Completed</p>
              </div>
            </div>

            {/* View Progress Button */}
            <Button 
              onClick={() => onViewProgress(member.id)}
              variant="outline" 
              size="sm" 
              className="w-full"
              disabled={progress.totalCourses === 0}
            >
              <Eye className="h-4 w-4 mr-2" />
              {progress.totalCourses === 0 ? 'No Courses Assigned' : 'View Detailed Progress'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamMemberProgressCard;
