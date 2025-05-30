
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, User, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('user');

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserRole();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      setProfile(data);
    }
  };

  const fetchUserRole = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching user role:', error);
    } else {
      setUserRole(data?.role || 'user');
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <img 
                src="/lovable-uploads/6f8c1259-11b1-4be9-a417-70350b17ddad.png" 
                alt="New Frontier University"
                className="h-16 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome to NFU Portal
                </h1>
                <p className="text-gray-600">Your legal education platform</p>
              </div>
            </div>
            
            <Button 
              onClick={handleSignOut}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <User className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold">Profile Information</h2>
              </div>
              
              <div className="space-y-2">
                <p><strong>Email:</strong> {user?.email}</p>
                {profile && (
                  <>
                    <p><strong>First Name:</strong> {profile.first_name || 'Not provided'}</p>
                    <p><strong>Last Name:</strong> {profile.last_name || 'Not provided'}</p>
                  </>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="h-6 w-6 text-green-600" />
                <h2 className="text-xl font-semibold">Access Level</h2>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  userRole === 'admin' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {userRole === 'admin' && (
            <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Administrator Access
              </h3>
              <p className="text-red-700">
                You have administrator privileges. You can manage users and system settings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
