
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Eye } from "lucide-react";
import { TeamMember } from "@/hooks/useTeamMembers";
import { getRoleBadgeColor } from "@/components/admin/user-management/userRoleUtils";
import UserProgressModal from "@/components/admin/user-progress/UserProgressModal";
import { useState } from "react";

interface TeamMemberCardProps {
  member: TeamMember;
}

const TeamMemberCard = ({ member }: TeamMemberCardProps) => {
  const [showProgressModal, setShowProgressModal] = useState(false);
  const role = member.roles?.[0] || 'student';

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={member.profile_image_url} />
              <AvatarFallback>
                {getInitials(member.first_name, member.last_name, member.email)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {member.first_name && member.last_name 
                    ? `${member.first_name} ${member.last_name}`
                    : member.email
                  }
                </p>
                <Badge className={getRoleBadgeColor(role)}>
                  {role}
                </Badge>
              </div>
              
              <p className="text-xs text-gray-500 truncate mt-1">
                {member.email}
              </p>
              
              <p className="text-xs text-gray-400 mt-1">
                Joined {new Date(member.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="mt-4 flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProgressModal(true)}
              className="flex-1"
            >
              <Eye className="h-3 w-3 mr-1" />
              View Progress
            </Button>
          </div>
        </CardContent>
      </Card>

      <UserProgressModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        userId={member.id}
      />
    </>
  );
};

export default TeamMemberCard;
