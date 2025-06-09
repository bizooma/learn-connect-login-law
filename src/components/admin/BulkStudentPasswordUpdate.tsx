
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Users, Lock } from "lucide-react";

const BulkStudentPasswordUpdate = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ total: number; successful: number; failed: number } | null>(null);
  const { toast } = useToast();

  const updateAllStudentPasswords = async () => {
    setIsProcessing(true);
    setResults(null);

    try {
      // First, get all users with student role
      const { data: studentRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, profiles(email, first_name, last_name)')
        .eq('role', 'student');

      if (rolesError) {
        throw rolesError;
      }

      if (!studentRoles || studentRoles.length === 0) {
        toast({
          title: "No Students Found",
          description: "No users with 'student' role were found in the system.",
          variant: "destructive",
        });
        return;
      }

      console.log(`Found ${studentRoles.length} student users to update`);

      let successful = 0;
      let failed = 0;
      const newPassword = "Nfil2025!";

      // Update each student's password
      for (const student of studentRoles) {
        try {
          const { data, error } = await supabase.functions.invoke('admin-change-password', {
            body: {
              userId: student.user_id,
              newPassword: newPassword
            }
          });

          if (error || data?.error) {
            console.error(`Failed to update password for user ${student.user_id}:`, error || data?.error);
            failed++;
          } else {
            console.log(`Successfully updated password for user ${student.user_id}`);
            successful++;
          }
        } catch (error) {
          console.error(`Exception updating password for user ${student.user_id}:`, error);
          failed++;
        }

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setResults({
        total: studentRoles.length,
        successful,
        failed
      });

      if (successful > 0) {
        toast({
          title: "Password Update Complete",
          description: `Successfully updated passwords for ${successful} out of ${studentRoles.length} student users.`,
        });
      }

      if (failed > 0) {
        toast({
          title: "Some Updates Failed",
          description: `${failed} password updates failed. Check console for details.`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error in bulk password update:', error);
      toast({
        title: "Update Failed",
        description: "An error occurred while updating student passwords.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Bulk Student Password Update
        </CardTitle>
        <CardDescription>
          This will change the password for ALL users with the 'student' role to: <strong>Nfil2025!</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Warning: This action cannot be undone</p>
            <p>All student users will need to use the new password: <strong>Nfil2025!</strong></p>
          </div>
        </div>

        {results && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Update Results:</h3>
            <div className="space-y-1 text-sm text-blue-800">
              <p>Total student users found: <strong>{results.total}</strong></p>
              <p>Successfully updated: <strong>{results.successful}</strong></p>
              <p>Failed updates: <strong>{results.failed}</strong></p>
            </div>
          </div>
        )}

        <Button 
          onClick={updateAllStudentPasswords} 
          disabled={isProcessing}
          className="w-full"
          variant="destructive"
        >
          <Lock className="h-4 w-4 mr-2" />
          {isProcessing ? "Updating Passwords..." : "Update All Student Passwords"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BulkStudentPasswordUpdate;
