
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { CourseFormData, SectionData } from "./course-form/types";
import { handleCourseSubmission } from "./course-form/courseSubmissionHandler";
import { useDraftManager } from "@/hooks/useDraftManager";
import { useAutoSave } from "@/hooks/useAutoSave";
import { Tables } from "@/integrations/supabase/types";

type CourseDraft = Tables<'course_drafts'>;

export const useCourseFormWithDrafts = (onSuccess: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lessons, setLessons] = useState<SectionData[]>([]);
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
        sections: lessons
      });
      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch (error) {
      setSaveStatus('error');
      throw error;
    }
  }, [saveAsDraft, lessons]);

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
      sections: lessons
    };
    debouncedSave(currentData);
  }, [watchedValues, lessons, debouncedSave]);

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

    if (draft.draft_data && (draft.draft_data as any).sections) {
      setLessons((draft.draft_data as any).sections);
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
      sections: lessons
    });
  }, [form, lessons, saveNow]);

  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true);
    try {
      await handleCourseSubmission(data, lessons);

      // Delete current draft after successful submission
      if (currentDraft) {
        await deleteDraft(currentDraft.id);
      }

      toast({
        title: "Success",
        description: "Course created successfully",
      });

      form.reset();
      setLessons([]);
      onSuccess();
    } catch (error) {
      console.error('Error creating course:', error);
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
    setLessons([]);
    setSaveStatus('idle');
    setLastSaved(undefined);
  }, [form]);

  return {
    form,
    isSubmitting,
    lessons,
    setLessons,
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
