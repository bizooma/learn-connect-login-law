import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Mail, Calendar, UserCheck } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { useState } from "react";
import EmployeeProgressModal from "@/components/owner/EmployeeProgressModal";

type Profile = Tables<'profiles'>;

interface EmployeeProfile extends Profile {
  roles?: Array<{ role: string }>;
}

interface AdminEmployeeCardProps {
  employee: EmployeeProfile;
}

const AdminEmployeeCard = ({ employee }: AdminEmployeeCardProps) => {
  const [showProgressModal, setShowProgressModal] = useState(false);

  const getUserInitials = () => {
    if (!employee.first_name && !employee.last_name) {
      return employee.email?.charAt(0).toUpperCase() || "U";
    }
    const firstName = employee.first_name || "";
    const lastName = employee.last_name || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'student':
        return 'bg-blue-100 text-blue-800';
      case 'client':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewProgress = () => {
    setShowProgressModal(true);
  };

  const currentRole = employee.roles?.[0]?.role || 'student';

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <Avatar className="h-10 w-10">
                <AvatarImage src={employee.profile_image_url || ""} alt={`${employee.first_name} ${employee.last_name}`} />
                <AvatarFallback className="text-sm">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-base font-medium">
                  {employee.first_name} {employee.last_name}
                </h3>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <Mail className="h-3 w-3 mr-1" />
                  {employee.email}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewProgress}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              View Progress
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div>
              <Badge className={getRoleBadgeColor(currentRole)}>
                {currentRole}
              </Badge>
            </div>
            
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="h-3 w-3 mr-1" />
              Added {new Date(employee.created_at || '').toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>

      <EmployeeProgressModal
        employee={employee}
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
      />
    </>
  );
};

export default AdminEmployeeCard;