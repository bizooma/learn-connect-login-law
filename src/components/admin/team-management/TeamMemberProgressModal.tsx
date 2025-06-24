
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Calendar, CheckCircle, Clock, AlertCircle, User } from 'lucide-react';
import { TeamMemberProgress, CourseProgress } from '@/hooks/useTeamProgress';
import { format } from 'date-fns';

interface TeamMemberProgressModalProps {
  member: TeamMemberProgress | null;
  isOpen: boolean;
  onClose: () => void;
}

const TeamMemberProgressModal = ({ member, isOpen, onClose }: TeamMemberProgressModalProps) => {
  if (!member) return null;

  const displayName = member.first_name && member.last_name 
    ? `${member.first_name} ${member.last_name}`
    : member.email;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (course: CourseProgress) => {
    switch (course.status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Not Started</Badge>;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Sort courses by progress (completed first, then by progress percentage)
  const sortedCourses = [...member.course_progress].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return -1;
    if (b.status === 'completed' && a.status !== 'completed') return 1;
    return b.progress_percentage - a.progress_percentage;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Progress Details - {displayName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Member Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{member.total_assigned_courses}</div>
                  <div className="text-sm text-gray-600">Total Assigned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{member.completed_courses}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{member.in_progress_courses}</div>
                  <div className="text-sm text-gray-600">In Progress</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getProgressColor(member.overall_progress)}`}>
                    {member.overall_progress}%
                  </div>
                  <div className="text-sm text-gray-600">Overall Progress</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Progress */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Course Progress</h3>
            
            {sortedCourses.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Courses Assigned</h4>
                  <p className="text-gray-600">This team member has no course assignments yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {sortedCourses.map((course) => (
                  <Card key={course.course_id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Course Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              {getStatusIcon(course.status)}
                              <h4 className="font-medium">{course.course_title}</h4>
                              {course.is_mandatory && (
                                <Badge variant="destructive" className="text-xs">Mandatory</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{course.course_category}</p>
                          </div>
                          {getStatusBadge(course)}
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Progress</span>
                            <span className={`text-sm font-bold ${getProgressColor(course.progress_percentage)}`}>
                              {course.progress_percentage}%
                            </span>
                          </div>
                          <Progress value={course.progress_percentage} className="h-2" />
                        </div>

                        {/* Course Dates */}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Assigned: {format(new Date(course.assigned_at), 'MMM d, yyyy')}</span>
                          </div>
                          {course.due_date && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>Due: {format(new Date(course.due_date), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                          {course.completed_at && (
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="h-3 w-3" />
                              <span>Completed: {format(new Date(course.completed_at), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamMemberProgressModal;
