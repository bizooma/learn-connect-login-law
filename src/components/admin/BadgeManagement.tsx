import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge, Users, Award, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface UserBadge {
  id: string;
  user_id: string;
  badge_name: string;
  description: string;
  badge_image_url?: string;
  badge_color: string;
  earned_at: string;
  user_email: string;
  user_name: string;
}

const BadgeManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [badgeForm, setBadgeForm] = useState({
    badge_name: "",
    description: "",
    badge_image_url: "",
    badge_color: "#FFD700"
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchUserBadges();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('is_deleted', false)
        .order('email');

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    }
  };

  const fetchUserBadges = async () => {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          id,
          user_id,
          badge_name,
          description,
          badge_image_url,
          badge_color,
          earned_at,
          profiles!inner(email, first_name, last_name)
        `)
        .eq('is_badge', true)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      
      const formattedBadges = data?.map(badge => ({
        ...badge,
        user_email: badge.profiles.email,
        user_name: `${badge.profiles.first_name || ''} ${badge.profiles.last_name || ''}`.trim() || badge.profiles.email
      })) || [];

      setUserBadges(formattedBadges);
    } catch (error: any) {
      console.error('Error fetching user badges:', error);
      toast({
        title: "Error",
        description: "Failed to load user badges",
        variant: "destructive",
      });
    }
  };

  const handleAssignBadge = async () => {
    if (!selectedUser || !badgeForm.badge_name || !badgeForm.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('assign_badge_to_user', {
        p_user_id: selectedUser,
        p_badge_name: badgeForm.badge_name,
        p_description: badgeForm.description,
        p_badge_image_url: badgeForm.badge_image_url || null,
        p_badge_color: badgeForm.badge_color
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Badge assigned successfully",
      });

      setBadgeForm({
        badge_name: "",
        description: "",
        badge_image_url: "",
        badge_color: "#FFD700"
      });
      setSelectedUser("");
      setDialogOpen(false);
      fetchUserBadges();
    } catch (error: any) {
      console.error('Error assigning badge:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign badge",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBadges = userBadges.filter(badge =>
    badge.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    badge.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    badge.badge_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Badge Management</h2>
          <p className="text-gray-600">Manually assign badges to users</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Award className="h-4 w-4" />
              <span>Assign Badge</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Badge to User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="user-select">Select User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredUsers.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name} (${user.email})`
                          : user.email
                        }
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="badge-name">Badge Name</Label>
                <Input
                  id="badge-name"
                  value={badgeForm.badge_name}
                  onChange={(e) => setBadgeForm({...badgeForm, badge_name: e.target.value})}
                  placeholder="e.g., Sales 100 Master"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={badgeForm.description}
                  onChange={(e) => setBadgeForm({...badgeForm, description: e.target.value})}
                  placeholder="Badge description..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="badge-image">Badge Image URL (Optional)</Label>
                <Input
                  id="badge-image"
                  value={badgeForm.badge_image_url}
                  onChange={(e) => setBadgeForm({...badgeForm, badge_image_url: e.target.value})}
                  placeholder="https://example.com/badge.png"
                />
              </div>

              <div>
                <Label htmlFor="badge-color">Badge Color</Label>
                <Input
                  id="badge-color"
                  type="color"
                  value={badgeForm.badge_color}
                  onChange={(e) => setBadgeForm({...badgeForm, badge_color: e.target.value})}
                />
              </div>

              <Button 
                onClick={handleAssignBadge} 
                disabled={loading}
                className="w-full"
              >
                {loading ? "Assigning..." : "Assign Badge"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>User Badges</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users or badges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredBadges.length === 0 ? (
            <div className="text-center py-8">
              <Badge className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No badges assigned yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBadges.map((badge) => (
                <div key={badge.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: badge.badge_color }}
                    >
                      {badge.badge_image_url ? (
                        <img 
                          src={badge.badge_image_url} 
                          alt={badge.badge_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <Award className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold">{badge.badge_name}</h4>
                      <p className="text-sm text-gray-600">{badge.user_name} ({badge.user_email})</p>
                      <p className="text-xs text-gray-500">{badge.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Earned: {new Date(badge.earned_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BadgeManagement;