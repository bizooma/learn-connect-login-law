
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserRole } from "@/hooks/useUserRole";
import { getAvailableRoles } from "./userRoleUtils";

interface UserRoleSelectProps {
  currentRole: string;
  onRoleChange: (newRole: 'admin' | 'owner' | 'student' | 'client' | 'free' | 'team_leader') => void;
}

const UserRoleSelect = ({ currentRole, onRoleChange }: UserRoleSelectProps) => {
  const { isAdmin, isOwner } = useUserRole();
  const availableRoles = getAvailableRoles(isAdmin, isOwner);

  return (
    <Select 
      value={currentRole} 
      onValueChange={onRoleChange}
    >
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {availableRoles.map((role) => (
          <SelectItem key={role.value} value={role.value}>
            {role.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default UserRoleSelect;
