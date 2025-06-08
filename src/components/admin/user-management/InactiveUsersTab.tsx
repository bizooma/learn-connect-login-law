
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { UserPlus, Search, Calendar, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "./types";
import { format } from "date-fns";

interface InactiveUsersTabProps {
  onUserRestored: () => void;
}

const InactiveUsersTab = ({ onUserRestored }: InactiveUsersTabProps) => {
  const [inactiveUsers, setInactiveUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [restoreReason, setRestoreReason] = useState("");
  const [restoreLoading, setRestoreLoading] = useState(false);
  const { toast } = useToast();

  const fetchInactiveUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch inactive users (soft deleted)
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          deleted_at,
          law_firm_name,
          profile_image_url,
          created_at
        `)
        .eq('is_deleted', true)
        .order('deleted_at', { ascending: false });

      if (error) throw error;

      // Get roles for each user
      const usersWithRoles = await Promise.all(
        (data || []).map(async (user) => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);
          
          return {
            ...user,
            roles: roles?.map(r => r.role) || []
          };
        })
      );

      setInactiveUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error fetching inactive users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch inactive users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInactiveUsers();
  }, []);

  const handleRestoreUser = async () => {
    if (!selectedUser || !restoreReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a reason for restoring this user.",
        variant: "destructive",
      });
      return;
    }

    setRestoreLoading(true);

    try {
      const { data, error } = await supabase.rpc('restore_user', {
        p_user_id: selectedUser.id,
        p_reason: restoreReason.trim()
      });

      if (error) throw error;

      toast({
        title: "User Restored",
        description: `${selectedUser.email} has been successfully restored and can now log in.`,
      });

      setRestoreDialogOpen(false);
      setSelectedUser(null);
      setRestoreReason("");
      onUserRestored();
      fetchInactiveUsers();

    } catch (error: any) {
      console.error('Error restoring user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to restore user",
        variant: "destructive",
      });
    } finally {
      setRestoreLoading(false);
    }
  };

  const filteredUsers = inactiveUsers.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return email?.charAt(0).toUpperCase() || "U";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Inactive Users</h3>
          <p className="text-sm text-gray-600">
            Users who have been deactivated but can be restored
          </p>
        </div>
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          {filteredUsers.length} inactive users
        </Badge>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search inactive users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Inactive Users</h3>
            <p className="text-gray-500">
              {searchTerm ? "No inactive users match your search." : "All users are currently active."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="border-orange-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.profile_image_url || undefined} />
                      <AvatarFallback className="bg-orange-100 text-orange-800">
                        {getInitials(user.first_name, user.last_name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}` 
                          : user.email
                        }
                      </h3>
                      <p className="text-xs text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    Inactive
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {user.law_firm_name && (
                    <p className="text-xs text-gray-500">
                      Law Firm: {user.law_firm_name}
                    </p>
                  )}
                  {user.roles && user.roles.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">Role:</span>
                      <Badge variant="outline" className="text-xs">
                        {user.roles[0]}
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    Deactivated {user.deleted_at ? format(new Date(user.deleted_at), 'MMM dd, yyyy') : 'Unknown'}
                  </div>
                  <Button
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      setSelectedUser(user);
                      setRestoreDialogOpen(true);
                    }}
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Restore User
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-green-600">
              <UserPlus className="h-5 w-5 mr-2" />
              Restore User Account
            </DialogTitle>
            <DialogDescription>
              Restoring <strong>{selectedUser?.email}</strong> will reactivate their account and allow them to log in again.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="restoreReason">Reason for restoration *</Label>
            <Textarea
              id="restoreReason"
              placeholder="Please provide a reason for restoring this user..."
              value={restoreReason}
              onChange={(e) => setRestoreReason(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setRestoreDialogOpen(false);
                setSelectedUser(null);
                setRestoreReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRestoreUser}
              disabled={restoreLoading || !restoreReason.trim()}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {restoreLoading ? "Restoring..." : "Restore User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InactiveUsersTab;
