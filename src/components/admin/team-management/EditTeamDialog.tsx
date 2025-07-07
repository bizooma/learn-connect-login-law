
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAdminTeams, AdminTeam } from '@/hooks/useAdminTeams';
import { logger } from '@/utils/logger';

interface EditTeamDialogProps {
  team: AdminTeam;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditTeamDialog = ({ team, open, onOpenChange }: EditTeamDialogProps) => {
  const { updateTeam } = useAdminTeams();
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(team.name);
    setDescription(team.description || '');
  }, [team]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    try {
      setLoading(true);
      await updateTeam(team.id, {
        name: name.trim(),
        description: description.trim() || undefined
      });
      onOpenChange(false);
    } catch (error) {
      logger.error('Error updating team:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-team-name">Team Name *</Label>
            <Input
              id="edit-team-name"
              placeholder="Enter team name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-team-description">Description</Label>
            <Textarea
              id="edit-team-description"
              placeholder="Enter team description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>
          
          <div className="flex space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || loading}
              className="flex-1"
            >
              {loading ? "Updating..." : "Update Team"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTeamDialog;
