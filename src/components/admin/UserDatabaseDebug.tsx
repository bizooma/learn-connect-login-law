
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const UserDatabaseDebug = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDebugCheck = async () => {
    setLoading(true);
    try {
      // Check profiles table
      const { data: profiles, error: profilesError, count: profilesCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      // Check user_roles table
      const { data: userRoles, error: rolesError, count: rolesCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact' });

      // Check auth users (this might not work due to RLS)
      let authUsersInfo = "Cannot access auth.users table directly";
      try {
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        if (authUsers) {
          authUsersInfo = `Found ${authUsers.users?.length || 0} auth users`;
        }
      } catch (error) {
        authUsersInfo = "Error accessing auth users: " + error.message;
      }

      setDebugInfo({
        profiles: {
          count: profilesCount,
          data: profiles,
          error: profilesError
        },
        userRoles: {
          count: rolesCount,
          data: userRoles,
          error: rolesError
        },
        authUsers: authUsersInfo
      });
    } catch (error) {
      console.error('Debug check failed:', error);
      setDebugInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Debug Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={runDebugCheck} disabled={loading}>
          {loading ? 'Checking...' : 'Check Database'}
        </Button>
        
        {debugInfo && (
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="font-semibold">Profiles Table:</h3>
              <p>Count: {debugInfo.profiles?.count}</p>
              {debugInfo.profiles?.error && (
                <p className="text-red-600">Error: {debugInfo.profiles.error.message}</p>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold">User Roles Table:</h3>
              <p>Count: {debugInfo.userRoles?.count}</p>
              {debugInfo.userRoles?.error && (
                <p className="text-red-600">Error: {debugInfo.userRoles.error.message}</p>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold">Auth Users:</h3>
              <p>{debugInfo.authUsers}</p>
            </div>
            
            {debugInfo.error && (
              <div>
                <h3 className="font-semibold text-red-600">Error:</h3>
                <p className="text-red-600">{debugInfo.error}</p>
              </div>
            )}
            
            <details className="mt-4">
              <summary className="cursor-pointer font-semibold">Raw Data</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserDatabaseDebug;
