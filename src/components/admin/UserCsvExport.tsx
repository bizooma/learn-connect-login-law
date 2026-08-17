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
      // First, get all users (active and inactive)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, created_at, is_deleted, deleted_at')
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

      // Last sign-in aggregated in the database (one row per user)
      const { data: lastSignIns, error: signInError } = await supabase.rpc('get_user_last_sign_ins');
      if (signInError) throw signInError;

      const lastSignInMap = new Map<string, string>();
      lastSignIns?.forEach((r: { user_id: string; last_sign_in: string | null }) => {
        if (r.user_id && r.last_sign_in) lastSignInMap.set(r.user_id, r.last_sign_in);
      });

      // Create a map of user_id to role for quick lookup
      const roleMap = new Map();
      userRoles?.forEach(ur => {
        roleMap.set(ur.user_id, ur.role);
      });

      // Format data for CSV export
      const csvData = profiles.map(user => {
        const role = roleMap.get(user.id) || 'no_role';
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'N/A';
        const isNfil = (user.email || '').toLowerCase().endsWith('@newfrontier.us');
        const lastSignIn = lastSignInMap.get(user.id);

        return {
          'Full Name': fullName,
          'Email Address': user.email || 'N/A',
          'Role': role,
          'User Type': isNfil ? 'NFIL Staff' : 'External Client',
          'Created Date': formatDateForCSV(user.created_at),
          'Last Sign In': lastSignIn ? formatDateForCSV(lastSignIn) : '',
          'Status': user.is_deleted ? 'Inactive' : 'Active',
          'Inactive Since': user.is_deleted && user.deleted_at ? formatDateForCSV(user.deleted_at) : ''
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