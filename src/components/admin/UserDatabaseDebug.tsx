
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

      // Try to get current session to see if we can access auth info
      const { data: session } = await supabase.auth.getSession();
      
      // Check auth users using admin client (this will likely fail with regular client)
      let authUsersInfo = "Cannot access auth.users with regular client";
      let authUsersCount = 0;
      
      try {
        // This will only work if the user has service role access
        const { data: authResponse, error: authError } = await supabase.auth.admin.listUsers();
        if (authResponse && !authError) {
          authUsersCount = authResponse.users?.length || 0;
          authUsersInfo = `Found ${authUsersCount} auth users`;
        } else {
          authUsersInfo = `Auth error: ${authError?.message || 'Unknown error'}`;
        }
      } catch (error) {
        authUsersInfo = `Cannot access auth users: ${error.message}`;
      }

      // Get some sample data for debugging
      const profileSample = profiles?.slice(0, 3) || [];
      const rolesSample = userRoles?.slice(0, 3) || [];

      setDebugInfo({
        profiles: {
          count: profilesCount,
          sample: profileSample,
          error: profilesError
        },
        userRoles: {
          count: rolesCount,
          sample: rolesSample,
          error: rolesError
        },
        authUsers: {
          info: authUsersInfo,
          count: authUsersCount
        },
        session: {
          exists: !!session?.session,
          userId: session?.session?.user?.id || 'No user ID'
        }
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
              {debugInfo.profiles?.sample && (
                <div className="text-xs mt-2">
                  <p>Sample entries:</p>
                  {debugInfo.profiles.sample.map((profile: any, index: number) => (
                    <p key={index}>- {profile.email} ({profile.first_name} {profile.last_name})</p>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold">User Roles Table:</h3>
              <p>Count: {debugInfo.userRoles?.count}</p>
              {debugInfo.userRoles?.error && (
                <p className="text-red-600">Error: {debugInfo.userRoles.error.message}</p>
              )}
              {debugInfo.userRoles?.sample && (
                <div className="text-xs mt-2">
                  <p>Sample entries:</p>
                  {debugInfo.userRoles.sample.map((role: any, index: number) => (
                    <p key={index}>- User {role.user_id.substring(0, 8)}... has role: {role.role}</p>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold">Auth Users:</h3>
              <p>{debugInfo.authUsers?.info}</p>
              <p>Count: {debugInfo.authUsers?.count}</p>
            </div>

            <div>
              <h3 className="font-semibold">Current Session:</h3>
              <p>Session exists: {debugInfo.session?.exists ? 'Yes' : 'No'}</p>
              <p>User ID: {debugInfo.session?.userId}</p>
            </div>
            
            {debugInfo.error && (
              <div>
                <h3 className="font-semibold text-red-600">Error:</h3>
                <p className="text-red-600">{debugInfo.error}</p>
              </div>
            )}
            
            <details className="mt-4">
              <summary className="cursor-pointer font-semibold">Raw Data</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-96">
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
