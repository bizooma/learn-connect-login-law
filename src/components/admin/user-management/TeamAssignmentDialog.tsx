
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "./types";
import { useQuery } from "@tanstack/react-query";

interface TeamAssignmentDialogProps {
  user: UserProfile;
  onAssignmentComplete: () => void;
}

const TeamAssignmentDialog = ({ user, onAssignmentComplete }: TeamAssignmentDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedTeamLeader, setSelectedTeamLeader] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch team leaders
  const { data: teamLeaders = [] } = useQuery({
    queryKey: ['teamLeaders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          user_roles!inner(role)
        `)
        .eq('user_roles.role', 'team_leader')
        .eq('is_deleted', false);

      if (error) throw error;
      return data || [];
    }
  });

  const handleAssignment = async () => {
    if (!selectedTeamLeader) {
      toast({
        title: "Error",
        description: "Please select a team leader",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          team_leader_id: selectedTeamLeader === 'none' ? null : selectedTeamLeader 
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: selectedTeamLeader === 'none' 
          ? "User removed from team" 
          : "User assigned to team leader successfully",
      });

      setDialogOpen(false);
      setSelectedTeamLeader("");
      onAssignmentComplete();

    } catch (error: any) {
      console.error('Error assigning team member:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign team member",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          Assign Team
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-blue-600">
            <Users className="h-5 w-5 mr-2" />
            Assign Team Leader
          </DialogTitle>
          <DialogDescription>
            Assign <strong>{user.email}</strong> to a team leader
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <label htmlFor="teamLeader" className="text-sm font-medium">
              Team Leader
            </label>
            <Select value={selectedTeamLeader} onValueChange={setSelectedTeamLeader}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a team leader" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Remove from team</SelectItem>
                {teamLeaders.map((leader) => (
                  <SelectItem key={leader.id} value={leader.id}>
                    {leader.first_name && leader.last_name 
                      ? `${leader.first_name} ${leader.last_name}` 
                      : leader.email
                    }
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setSelectedTeamLeader("");
              setDialogOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssignment}
            disabled={loading || !selectedTeamLeader}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {loading ? "Assigning..." : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TeamAssignmentDialog;
