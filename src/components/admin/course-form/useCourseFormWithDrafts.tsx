import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { CourseFormData } from "./types";
import { handleCourseSubmission } from "./courseSubmissionHandler";
import { useDraftManager } from "@/hooks/useDraftManager";
import { useAutoSave } from "@/hooks/useAutoSave";
import { Tables } from "@/integrations/supabase/types";
import { logger } from "@/utils/logger";

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

type CourseDraft = Tables<'course_drafts'>;

export const useCourseFormWithDrafts = (onSuccess: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error' | 'idle'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | undefined>();
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<CourseFormData>({
    defaultValues: {
      title: "",
      description: "",
      instructor: "",
      category: "",
      level: "",
      duration: "",
      image_file: undefined,
    },
  });

  const {
    drafts,
    currentDraft,
    saveAsDraft,
    loadDraft,
    deleteDraft,
    fetchDrafts
  } = useDraftManager();

  const handleAutoSave = useCallback(async (data: any) => {
    setSaveStatus('saving');
    try {
      await saveAsDraft({
        title: data.title || '',
        description: data.description || '',
        instructor: data.instructor || '',
        category: data.category || '',
        level: data.level || '',
        duration: data.duration || '',
        image_url: data.image_url || '',
        modules: modules
      });
      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch (error) {
      setSaveStatus('error');
      throw error;
    }
  }, [saveAsDraft, modules]);

  const { debouncedSave, saveNow } = useAutoSave({
    onSave: handleAutoSave,
    delay: 3000,
    enabled: true
  });

  // Watch form changes for auto-save
  const watchedValues = form.watch();
  
  useEffect(() => {
    const currentData = {
      ...watchedValues,
      modules
    };
    debouncedSave(currentData);
  }, [watchedValues, modules, debouncedSave]);

  const handleLoadDraft = useCallback(async (draft: CourseDraft) => {
    await loadDraft(draft.id);
    
    form.reset({
      title: draft.title || "",
      description: draft.description || "",
      instructor: draft.instructor || "",
      category: draft.category || "",
      level: draft.level || "",
      duration: draft.duration || "",
      image_file: undefined,
    });

    if (draft.draft_data && (draft.draft_data as any).modules) {
      setModules((draft.draft_data as any).modules);
    }

    toast({
      title: "Draft loaded",
      description: "Your draft has been restored successfully.",
    });
  }, [loadDraft, form, toast]);

  const handleSaveDraft = useCallback(async () => {
    const formData = form.getValues();
    await saveNow({
      ...formData,
      modules
    });
  }, [form, modules, saveNow]);

  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true);
    try {
      // Pass modules directly to the submission handler without sanitization
      await handleCourseSubmission(data, [], modules);

      // Delete current draft after successful submission
      if (currentDraft) {
        await deleteDraft(currentDraft.id);
      }

      toast({
        title: "Success",
        description: "Course created successfully",
      });

      form.reset();
      setModules([]);
      onSuccess();
    } catch (error) {
      logger.error('Error creating course:', error);
      toast({
        title: "Error",
        description: "Failed to create course",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartNew = useCallback(() => {
    form.reset();
    setModules([]);
    setSaveStatus('idle');
    setLastSaved(undefined);
  }, [form]);

  return {
    form,
    isSubmitting,
    modules,
    setModules,
    onSubmit,
    saveStatus,
    lastSaved,
    showDraftDialog,
    setShowDraftDialog,
    drafts,
    handleLoadDraft,
    handleSaveDraft,
    deleteDraft,
    handleStartNew,
  };
};
