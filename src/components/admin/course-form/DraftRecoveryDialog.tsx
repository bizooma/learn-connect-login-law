
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Tables } from '@/integrations/supabase/types';

type CourseDraft = Tables<'course_drafts'>;

interface DraftRecoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drafts: CourseDraft[];
  onLoadDraft: (draft: CourseDraft) => void;
  onDeleteDraft: (draftId: string) => void;
  onStartNew: () => void;
}

const DraftRecoveryDialog = ({
  open,
  onOpenChange,
  drafts,
  onLoadDraft,
  onDeleteDraft,
  onStartNew
}: DraftRecoveryDialogProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteDraft = async (draftId: string) => {
    setDeletingId(draftId);
    await onDeleteDraft(draftId);
    setDeletingId(null);
  };

  const handleLoadDraft = (draft: CourseDraft) => {
    onLoadDraft(draft);
    onOpenChange(false);
  };

  const handleStartNew = () => {
    onStartNew();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Recover Draft Course</DialogTitle>
          <DialogDescription>
            You have unsaved drafts. Would you like to continue working on one of them or start fresh?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {drafts.map((draft) => (
            <div key={draft.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-lg truncate">
                    {draft.title || 'Untitled Course'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {draft.description || 'No description'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteDraft(draft.id)}
                  disabled={deletingId === draft.id}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Last saved: {format(new Date(draft.updated_at), 'MMM d, yyyy h:mm a')}</span>
                </div>
                {draft.draft_data && (
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    <span>
                      {(draft.draft_data as any)?.sections?.length || 0} sections
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  {draft.instructor && (
                    <Badge variant="outline">{draft.instructor}</Badge>
                  )}
                  {draft.category && (
                    <Badge variant="outline">{draft.category}</Badge>
                  )}
                  {draft.level && (
                    <Badge variant="outline">{draft.level}</Badge>
                  )}
                </div>
                <Button onClick={() => handleLoadDraft(draft)}>
                  Continue Editing
                </Button>
              </div>
            </div>
          ))}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={handleStartNew}>
              Start New Course
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DraftRecoveryDialog;
