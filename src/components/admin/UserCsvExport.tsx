import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { exportToCSV, formatDateForCSV } from "@/lib/csvUtils";
import { useToast } from "@/hooks/use-toast";

const UserCsvExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportUsers = async () => {
    setIsExporting(true);
    try {
      // First, get all users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, created_at, is_deleted')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (profilesError) {
        throw profilesError;
      }

      if (!profiles || profiles.length === 0) {
        toast({
          title: "No Data",
          description: "No users found to export",
          variant: "destructive",
        });
        return;
      }

      // Then get all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        throw rolesError;
      }

      // Create a map of user_id to role for quick lookup
      const roleMap = new Map();
      userRoles?.forEach(ur => {
        roleMap.set(ur.user_id, ur.role);
      });

      // Format data for CSV export
      const csvData = profiles.map(user => {
        const role = roleMap.get(user.id) || 'no_role';
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'N/A';
        
        return {
          'Full Name': fullName,
          'Email Address': user.email || 'N/A',
          'Role': role,
          'Created Date': formatDateForCSV(user.created_at),
          'Status': user.is_deleted ? 'Deleted' : 'Active'
        };
      });

      // Sort by role hierarchy
      const roleOrder = {
        'admin': 1,
        'owner': 2,
        'team_leader': 3,
        'student': 4,
        'client': 5,
        'free': 6,
        'no_role': 7
      };

      csvData.sort((a, b) => {
        const roleA = roleOrder[a.Role as keyof typeof roleOrder] || 7;
        const roleB = roleOrder[b.Role as keyof typeof roleOrder] || 7;
        
        if (roleA !== roleB) {
          return roleA - roleB;
        }
        
        // Secondary sort by name
        return a['Full Name'].localeCompare(b['Full Name']);
      });

      // Generate filename with current date
      const today = new Date().toISOString().split('T')[0];
      const filename = `users-export-${today}.csv`;

      // Export to CSV
      exportToCSV(csvData, filename);

      toast({
        title: "Export Successful",
        description: `${csvData.length} users exported to ${filename}`,
      });

    } catch (error) {
      console.error('Error exporting users:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export users",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      onClick={exportUsers} 
      disabled={isExporting}
      className="flex items-center space-x-2"
    >
      {isExporting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          <Users className="h-4 w-4" />
          <span>Export All Users CSV</span>
        </>
      )}
    </Button>
  );
};

export default UserCsvExport;