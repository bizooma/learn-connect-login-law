
import { useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseAutoSaveOptions {
  onSave: (data: any) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export const useAutoSave = ({ onSave, delay = 2000, enabled = true }: UseAutoSaveOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();
  const isSavingRef = useRef(false);
  const lastSaveDataRef = useRef<string>('');

  const debouncedSave = useCallback(async (data: any) => {
    if (!enabled || isSavingRef.current) return;

    const currentDataString = JSON.stringify(data);
    if (currentDataString === lastSaveDataRef.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        isSavingRef.current = true;
        await onSave(data);
        lastSaveDataRef.current = currentDataString;
        console.log('Auto-saved successfully');
      } catch (error) {
        console.error('Auto-save failed:', error);
        toast({
          title: "Auto-save failed",
          description: "Your changes couldn't be saved automatically. Please save manually.",
          variant: "destructive",
        });
      } finally {
        isSavingRef.current = false;
      }
    }, delay);
  }, [onSave, delay, enabled, toast]);

  const saveNow = useCallback(async (data: any) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    try {
      isSavingRef.current = true;
      await onSave(data);
      lastSaveDataRef.current = JSON.stringify(data);
      toast({
        title: "Draft saved",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      console.error('Manual save failed:', error);
      toast({
        title: "Save failed",
        description: "Failed to save your changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave, toast]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    debouncedSave,
    saveNow,
    isSaving: isSavingRef.current
  };
};
