
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateUnitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnitCreated: () => void;
}

const CreateUnitModal: React.FC<CreateUnitModalProps> = ({
  open,
  onOpenChange,
  onUnitCreated
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Please enter a unit title');
      return;
    }

    setIsCreating(true);
    try {
      // Create temp course/module/lesson structure for orphaned units
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

      let { data: tempLesson, error: lessonError } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', tempCourse.id)
        .eq('module_id', tempModule.id)
        .eq('title', '__TEMP_ORPHANED_LESSON__')
        .single();

      if (lessonError || !tempLesson) {
        const { data: newLesson, error: createLessonError } = await supabase
          .from('lessons')
          .insert({
            course_id: tempCourse.id,
            module_id: tempModule.id,
            title: '__TEMP_ORPHANED_LESSON__',
            description: 'Temporary lesson for orphaned units',
            sort_order: 0
          })
          .select('id')
          .single();

        if (createLessonError || !newLesson) {
          throw createLessonError;
        }
        tempLesson = newLesson;
      }

      // Create the unit
      const { error: unitError } = await supabase
        .from('units')
        .insert({
          section_id: tempLesson.id,
          title,
          description,
          content,
          sort_order: 0,
          is_draft: false
        });

      if (unitError) {
        throw unitError;
      }

      toast.success('Unit created successfully');
      setTitle('');
      setDescription('');
      setContent('');
      onOpenChange(false);
      onUnitCreated();
    } catch (error) {
      console.error('Error creating unit:', error);
      toast.error('Failed to create unit');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Unit</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="unit-title">Title</Label>
            <Input
              id="unit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter unit title"
            />
          </div>
          
          <div>
            <Label htmlFor="unit-description">Description</Label>
            <Textarea
              id="unit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter unit description (optional)"
              rows={2}
            />
          </div>
          
          <div>
            <Label htmlFor="unit-content">Content</Label>
            <Textarea
              id="unit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter unit content (optional)"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Unit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUnitModal;
