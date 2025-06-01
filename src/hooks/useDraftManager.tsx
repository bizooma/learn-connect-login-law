
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type CourseDraft = Tables<'course_drafts'>;

interface ModuleData {
  id?: string;
  title: string;
  description: string;
  image_url?: string;
  sort_order: number;
  lessons: LessonData[];
}

interface LessonData {
  id?: string;
  title: string;
  description: string;
  image_url?: string;
  sort_order: number;
  units: UnitData[];
}

interface UnitData {
  id?: string;
  title: string;
  description: string;
  content: string;
  video_url: string;
  video_type: 'youtube' | 'upload';
  video_file?: File;
  duration_minutes: number;
  sort_order: number;
  quiz_id?: string;
}

interface DraftData {
  title: string;
  description: string;
  instructor: string;
  category: string;
  level: string;
  duration: string;
  image_url?: string;
  modules: ModuleData[];
}

export const useDraftManager = (courseId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<CourseDraft[]>([]);
  const [currentDraft, setCurrentDraft] = useState<CourseDraft | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDrafts = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('course_drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDrafts(data || []);
    } catch (error) {
      console.error('Error fetching drafts:', error);
    }
  }, [user?.id]);

  const createDraft = useCallback(async (draftData: Partial<DraftData>) => {
    if (!user?.id) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('course_drafts')
        .insert({
          user_id: user.id,
          title: draftData.title || 'Untitled Course',
          description: draftData.description || '',
          instructor: draftData.instructor || '',
          category: draftData.category || '',
          level: draftData.level || '',
          duration: draftData.duration || '',
          image_url: draftData.image_url || null,
          draft_data: {
            modules: draftData.modules || []
          }
        })
        .select()
        .single();

      if (error) throw error;
      
      setCurrentDraft(data);
      await fetchDrafts();
      return data;
    } catch (error) {
      console.error('Error creating draft:', error);
      toast({
        title: "Error",
        description: "Failed to create draft",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchDrafts, toast]);

  const updateDraft = useCallback(async (draftId: string, draftData: Partial<DraftData>) => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('course_drafts')
        .update({
          title: draftData.title,
          description: draftData.description,
          instructor: draftData.instructor,
          category: draftData.category,
          level: draftData.level,
          duration: draftData.duration,
          image_url: draftData.image_url,
          draft_data: {
            modules: draftData.modules || []
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', draftId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setCurrentDraft(data);
      await fetchDrafts();
      return data;
    } catch (error) {
      console.error('Error updating draft:', error);
      throw error;
    }
  }, [user?.id, fetchDrafts]);

  const deleteDraft = useCallback(async (draftId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('course_drafts')
        .delete()
        .eq('id', draftId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      await fetchDrafts();
      if (currentDraft?.id === draftId) {
        setCurrentDraft(null);
      }
      
      toast({
        title: "Draft deleted",
        description: "The draft has been removed successfully.",
      });
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast({
        title: "Error",
        description: "Failed to delete draft",
        variant: "destructive",
      });
    }
  }, [user?.id, currentDraft?.id, fetchDrafts, toast]);

  const loadDraft = useCallback(async (draftId: string) => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('course_drafts')
        .select('*')
        .eq('id', draftId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      setCurrentDraft(data);
      return data;
    } catch (error) {
      console.error('Error loading draft:', error);
      return null;
    }
  }, [user?.id]);

  const saveAsDraft = useCallback(async (draftData: DraftData) => {
    if (currentDraft) {
      return await updateDraft(currentDraft.id, draftData);
    } else {
      return await createDraft(draftData);
    }
  }, [currentDraft, updateDraft, createDraft]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  return {
    drafts,
    currentDraft,
    loading,
    createDraft,
    updateDraft,
    deleteDraft,
    loadDraft,
    saveAsDraft,
    fetchDrafts
  };
};
