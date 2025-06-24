
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Eye, User, BookOpen, CheckCircle, Clock } from 'lucide-react';
import { TeamMemberProgress } from '@/hooks/useTeamProgress';

interface TeamMemberProgressCardProps {
  member: TeamMemberProgress;
  onViewDetails: () => void;
}

const TeamMemberProgressCard = ({ member, onViewDetails }: TeamMemberProgressCardProps) => {
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = () => {
    if (member.completed_courses === member.total_assigned_courses && member.total_assigned_courses > 0) {
      return <Badge className="bg-green-100 text-green-800">All Complete</Badge>;
    }
    if (member.in_progress_courses > 0) {
      return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
    }
    if (member.overall_progress === 0) {
      return <Badge className="bg-gray-100 text-gray-800">Not Started</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
  };

  const displayName = member.first_name && member.last_name 
    ? `${member.first_name} ${member.last_name}`
    : member.email;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <h3 className="font-medium text-sm truncate">{displayName}</h3>
                {member.first_name && member.last_name && (
                  <p className="text-xs text-gray-500 truncate">{member.email}</p>
                )}
              </div>
            </div>
            {getStatusBadge()}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className={`text-sm font-bold ${getProgressColor(member.overall_progress)}`}>
                {member.overall_progress}%
              </span>
            </div>
            <Progress value={member.overall_progress} className="h-2" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-lg font-bold">{member.total_assigned_courses}</div>
              <div className="text-xs text-gray-500">Assigned</div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-lg font-bold">{member.completed_courses}</div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-center">
                <Clock className="h-4 w-4 text-orange-500" />
              </div>
              <div className="text-lg font-bold">{member.in_progress_courses}</div>
              <div className="text-xs text-gray-500">In Progress</div>
            </div>
          </div>

          {/* Action Button */}
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onViewDetails}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamMemberProgressCard;
