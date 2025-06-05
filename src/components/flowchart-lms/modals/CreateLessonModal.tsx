
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateLessonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLessonCreated: () => void;
}

const CreateLessonModal: React.FC<CreateLessonModalProps> = ({
  open,
  onOpenChange,
  onLessonCreated
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Please enter a lesson title');
      return;
    }

    setIsCreating(true);
    try {
      // Create a temporary course and module for orphaned lessons
      let { data: tempCourse, error: courseError } = await supabase
        .from('courses')
        .select('id')
        .eq('title', '__TEMP_ORPHANED_CONTENT__')
        .single();

      if (courseError || !tempCourse) {
        const { data: newCourse, error: createCourseError } = await supabase
          .from('courses')
          .insert({
            title: '__TEMP_ORPHANED_CONTENT__',
            description: 'Temporary course for orphaned content',
            category: 'temp',
            level: 'temp',
            duration: 'temp',
            instructor: 'temp',
            is_draft: true
          })
          .select('id')
          .single();

        if (createCourseError || !newCourse) {
          throw createCourseError;
        }
        tempCourse = newCourse;
      }

      let { data: tempModule, error: moduleError } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', tempCourse.id)
        .eq('title', '__TEMP_ORPHANED_MODULE__')
        .single();

      if (moduleError || !tempModule) {
        const { data: newModule, error: createModuleError } = await supabase
          .from('modules')
          .insert({
            course_id: tempCourse.id,
            title: '__TEMP_ORPHANED_MODULE__',
            description: 'Temporary module for orphaned lessons',
            sort_order: 0
          })
          .select('id')
          .single();

        if (createModuleError || !newModule) {
          throw createModuleError;
        }
        tempModule = newModule;
      }

      // Create the lesson
      const { error: lessonError } = await supabase
        .from('lessons')
        .insert({
          course_id: tempCourse.id,
          module_id: tempModule.id,
          title,
          description,
          sort_order: 0,
          is_draft: false
        });

      if (lessonError) {
        throw lessonError;
      }

      toast.success('Lesson created successfully');
      setTitle('');
      setDescription('');
      onOpenChange(false);
      onLessonCreated();
    } catch (error) {
      console.error('Error creating lesson:', error);
      toast.error('Failed to create lesson');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Lesson</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="lesson-title">Title</Label>
            <Input
              id="lesson-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter lesson title"
            />
          </div>
          
          <div>
            <Label htmlFor="lesson-description">Description</Label>
            <Textarea
              id="lesson-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter lesson description (optional)"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Lesson'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLessonModal;
