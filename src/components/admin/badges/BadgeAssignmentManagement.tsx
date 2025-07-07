import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Award, Users, Search } from "lucide-react";

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface BadgeTemplate {
  id: string;
  name: string;
  description?: string;
  image_url: string;
  badge_color: string;
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
  template_id?: string;
}

const BadgeAssignmentManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<BadgeTemplate[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchTemplates();
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
      logger.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('badge_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      logger.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load badge templates",
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
          template_id,
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
      logger.error('Error fetching user badges:', error);
      toast({
        title: "Error",
        description: "Failed to load user badges",
        variant: "destructive",
      });
    }
  };

  const handleAssignBadge = async () => {
    if (!selectedUser || !selectedTemplate) {
      toast({
        title: "Error",
        description: "Please select both a user and a badge template",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('assign_badge_from_template', {
        p_user_id: selectedUser,
        p_template_id: selectedTemplate
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Badge assigned successfully",
      });

      setSelectedUser("");
      setSelectedTemplate("");
      setDialogOpen(false);
      fetchUserBadges();
    } catch (error: any) {
      logger.error('Error assigning badge:', error);
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

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Badge Assignments</h3>
          <p className="text-sm text-muted-foreground">Assign badges to users</p>
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
                <Label htmlFor="template-select">Select Badge Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a badge template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: template.badge_color }}
                          />
                          <span>{template.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplateData && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: selectedTemplateData.badge_color }}
                    >
                      <img
                        src={selectedTemplateData.image_url}
                        alt={selectedTemplateData.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{selectedTemplateData.name}</p>
                      {selectedTemplateData.description && (
                        <p className="text-xs text-muted-foreground">{selectedTemplateData.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleAssignBadge} 
                disabled={loading || !selectedUser || !selectedTemplate}
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
            <span>Assigned Badges</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
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
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No badges assigned yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBadges.map((badge) => (
                <div key={badge.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
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
                      <p className="text-sm text-muted-foreground">{badge.user_name} ({badge.user_email})</p>
                      {badge.description && (
                        <p className="text-xs text-muted-foreground">{badge.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Earned: {new Date(badge.earned_at).toLocaleDateString()}
                    </p>
                    {badge.template_id && (
                      <p className="text-xs text-muted-foreground">From template</p>
                    )}
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

export default BadgeAssignmentManagement;
