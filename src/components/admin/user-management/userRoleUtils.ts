
import { UserProfile } from "./types";

export const getUserRole = (user: UserProfile): string => {
  return user.roles?.[0] || 'student';
};

export const getRoleBadgeColor = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800';
    case 'owner':
      return 'bg-purple-100 text-purple-800';
    case 'team_leader':
      return 'bg-orange-100 text-orange-800';
    case 'student':
      return 'bg-blue-100 text-blue-800';
    case 'client':
      return 'bg-green-100 text-green-800';
    case 'free':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-blue-100 text-blue-800'; // Default to student styling
  }
};

export const getAvailableRoles = (isAdmin: boolean, isOwner: boolean) => {
  if (isAdmin) {
    // Admins can assign any role
    return [
      { value: 'free', label: 'Free' },
      { value: 'student', label: 'Student' },
      { value: 'client', label: 'Client' },
      { value: 'team_leader', label: 'Team Leader' },
      { value: 'owner', label: 'Owner' },
      { value: 'admin', label: 'Admin' }
    ];
  } else if (isOwner) {
    // Owners can only assign student, client, and free roles
    return [
      { value: 'free', label: 'Free' },
      { value: 'student', label: 'Student' },
      { value: 'client', label: 'Client' }
    ];
  }
  return [];
};

export const filterUsers = (users: UserProfile[], searchTerm: string): UserProfile[] => {
  return users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );
};
