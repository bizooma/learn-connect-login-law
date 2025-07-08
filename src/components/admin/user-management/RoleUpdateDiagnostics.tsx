import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DiagnosticResult {
  userId: string;
  email: string;
  profileRole: string | null;
  databaseRole: string | null;
  hasLawFirm: boolean;
  lawFirmName: string | null;
  isOwnerWithoutFirm: boolean;
  inconsistencies: string[];
  recommendations: string[];
}

interface RoleUpdateDiagnosticsProps {
  userId?: string;
  userEmail?: string;
}

const RoleUpdateDiagnostics = ({ userId, userEmail }: RoleUpdateDiagnosticsProps) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [searchEmail, setSearchEmail] = useState(userEmail || "");
  const { toast } = useToast();

  const runDiagnostics = async (targetUserId?: string, targetEmail?: string) => {
    setLoading(true);
    try {
      let userToCheck = targetUserId;
      
      // If no userId provided, find by email
      if (!userToCheck && targetEmail) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', targetEmail)
          .single();
        
        if (!profile) {
          toast({
            title: "User Not Found",
            description: `No user found with email: ${targetEmail}`,
            variant: "destructive",
          });
          return;
        }
        userToCheck = profile.id;
      }

      if (!userToCheck) {
        toast({
          title: "Missing Information",
          description: "Please provide either a user ID or email address",
          variant: "destructive",
        });
        return;
      }

      // Fetch comprehensive user data
      const [profileResult, roleResult, lawFirmResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userToCheck)
          .single(),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userToCheck)
          .maybeSingle(),
        supabase
          .from('law_firms')
          .select('name')
          .eq('owner_id', userToCheck)
          .maybeSingle()
      ]);

      const profile = profileResult.data;
      const role = roleResult.data;
      const lawFirm = lawFirmResult.data;

      if (!profile) {
        toast({
          title: "Profile Not Found",
          description: "User profile does not exist",
          variant: "destructive",
        });
        return;
      }

      const inconsistencies: string[] = [];
      const recommendations: string[] = [];

      // Check for role inconsistencies
      const profileRole = null; // Profiles table doesn't store role directly
      const databaseRole = role?.role || null;
      
      // Note: We don't check profile vs database role mismatch since profiles table doesn't store roles
      // Roles are stored in the user_roles table only

      // Check owner without law firm
      const isOwnerWithoutFirm = databaseRole === 'owner' && !lawFirm;
      if (isOwnerWithoutFirm) {
        inconsistencies.push("User is marked as 'owner' but has no law firm associated");
        recommendations.push("Create a law firm record for this owner");
      }

      // Check for missing role entirely
      if (!databaseRole) {
        inconsistencies.push("User has no role assigned in user_roles table");
        recommendations.push("Assign an appropriate role to this user");
      }

      const diagnosticResult: DiagnosticResult = {
        userId: userToCheck,
        email: profile.email,
        profileRole,
        databaseRole,
        hasLawFirm: !!lawFirm,
        lawFirmName: lawFirm?.name || null,
        isOwnerWithoutFirm,
        inconsistencies,
        recommendations
      };

      setResult(diagnosticResult);

      if (inconsistencies.length === 0) {
        toast({
          title: "Diagnostics Complete",
          description: "No role inconsistencies found",
        });
      } else {
        toast({
          title: "Issues Detected",
          description: `Found ${inconsistencies.length} issue(s) requiring attention`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error running diagnostics:', error);
      toast({
        title: "Diagnostic Error",
        description: error.message || "Failed to run diagnostics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fixOwnerLawFirm = async () => {
    if (!result) return;
    
    try {
      // Navigate user to law firm setup
      toast({
        title: "Law Firm Setup Required",
        description: "This user needs to create a law firm. Please have them log in and complete the law firm setup process.",
      });
    } catch (error) {
      console.error('Error setting up law firm:', error);
      toast({
        title: "Error",
        description: "Failed to initiate law firm setup",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="h-5 w-5" />
          <span>Role Update Diagnostics</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!userId && (
          <div className="flex space-x-2">
            <input
              type="email"
              placeholder="Enter user email to diagnose..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button 
              onClick={() => runDiagnostics(undefined, searchEmail)}
              disabled={loading || !searchEmail}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Diagnose"}
            </Button>
          </div>
        )}

        {userId && (
          <Button 
            onClick={() => runDiagnostics(userId)}
            disabled={loading}
            className="w-full"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
            Run Diagnostics
          </Button>
        )}

        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-gray-700">User Email</h4>
                <p className="text-sm">{result.email}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-700">Database Role</h4>
                <Badge variant={result.databaseRole ? "default" : "destructive"}>
                  {result.databaseRole || "No Role"}
                </Badge>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-700">Has Law Firm</h4>
                <div className="flex items-center space-x-1">
                  {result.hasLawFirm ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm">{result.hasLawFirm ? 'Yes' : 'No'}</span>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-700">Law Firm Name</h4>
                <p className="text-sm">{result.lawFirmName || "None"}</p>
              </div>
            </div>

            {result.inconsistencies.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Issues Found:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {result.inconsistencies.map((issue, index) => (
                        <li key={index} className="text-sm">{issue}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {result.recommendations.length > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Recommendations:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {result.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm">{rec}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {result.isOwnerWithoutFirm && (
              <Button 
                onClick={fixOwnerLawFirm}
                variant="outline"
                className="w-full"
              >
                Help Setup Law Firm
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoleUpdateDiagnostics;