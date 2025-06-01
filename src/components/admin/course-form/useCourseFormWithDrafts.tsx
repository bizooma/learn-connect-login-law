
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { CourseFormData, SectionData } from "./types";
import { handleCourseSubmission } from "./courseSubmissionHandler";
import { useDraftManager } from "@/hooks/useDraftManager";
import { useAutoSave } from "@/hooks/useAutoSave";
import { Tables } from "@/integrations/supabase/types";

type CourseDraft = Tables<'course_drafts'>;

export const useCourseFormWithDrafts = (onSuccess: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sections, setSections] = useState<SectionData[]>([]);
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
        sections: sections
      });
      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch (error) {
      setSaveStatus('error');
      throw error;
    }
  }, [saveAsDraft, sections]);

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
      sections
    };
    debouncedSave(currentData);
  }, [watchedValues, sections, debouncedSave]);

  // Show draft recovery dialog on component mount if drafts exist
  useEffect(() => {
    if (drafts.length > 0 && !currentDraft) {
      setShowDraftDialog(true);
    }
  }, [drafts, currentDraft]);

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
      setSections((draft.draft_data as any).sections);
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
      sections
    });
  }, [form, sections, saveNow]);

  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true);
    try {
      await handleCourseSubmission(data, sections);

      // Delete current draft after successful submission
      if (currentDraft) {
        await deleteDraft(currentDraft.id);
      }

      toast({
        title: "Success",
        description: "Course created successfully",
      });

      form.reset();
      setSections([]);
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
    setSections([]);
    setSaveStatus('idle');
    setLastSaved(undefined);
  }, [form]);

  return {
    form,
    isSubmitting,
    sections,
    setSections,
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
