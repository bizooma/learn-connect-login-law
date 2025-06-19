
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useProgressBackfill = () => {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const backfillMissingUnitCompletions = async () => {
    setProcessing(true);
    
    try {
      console.log('Starting backfill of missing unit completions...');
      
      // Query to find users with completed quizzes but incomplete units
      const { data: incompleteUnits, error } = await supabase
        .from('user_unit_progress')
        .select(`
          user_id,
          unit_id,
          course_id,
          quiz_completed,
          quiz_completed_at,
          completed,
          units!inner(video_url, title)
        `)
        .eq('quiz_completed', true)
        .eq('completed', false);

      if (error) {
        throw error;
      }

      console.log(`Found ${incompleteUnits?.length || 0} units with completed quizzes but incomplete status`);

      if (!incompleteUnits || incompleteUnits.length === 0) {
        toast({
          title: "No Issues Found",
          description: "All quiz completions are properly reflected in unit progress.",
        });
        return;
      }

      let backfilledCount = 0;
      const errors: string[] = [];

      // Process each incomplete unit
      for (const unitProgress of incompleteUnits) {
        try {
          const hasVideo = !!unitProgress.units?.video_url;
          
          // For quiz-only units (no video), mark as completed
          if (!hasVideo) {
            const { error: updateError } = await supabase
              .from('user_unit_progress')
              .update({
                completed: true,
                completed_at: unitProgress.quiz_completed_at || new Date().toISOString(),
                completion_method: 'quiz_only_backfill',
                updated_at: new Date().toISOString()
              })
              .eq('user_id', unitProgress.user_id)
              .eq('unit_id', unitProgress.unit_id)
              .eq('course_id', unitProgress.course_id);

            if (updateError) {
              errors.push(`Failed to update unit ${unitProgress.unit_id}: ${updateError.message}`);
            } else {
              backfilledCount++;
              console.log(`Backfilled completion for quiz-only unit: ${unitProgress.unit_id}`);
            }
          } else {
            // For units with video, check if video is also completed
            const { data: videoProgress } = await supabase
              .from('user_video_progress')
              .select('is_completed')
              .eq('user_id', unitProgress.user_id)
              .eq('unit_id', unitProgress.unit_id)
              .eq('course_id', unitProgress.course_id)
              .maybeSingle();

            if (videoProgress?.is_completed) {
              // Both quiz and video completed, mark unit as complete
              const { error: updateError } = await supabase
                .from('user_unit_progress')
                .update({
                  completed: true,
                  completed_at: unitProgress.quiz_completed_at || new Date().toISOString(),
                  completion_method: 'hybrid_backfill',
                  updated_at: new Date().toISOString()
                })
                .eq('user_id', unitProgress.user_id)
                .eq('unit_id', unitProgress.unit_id)
                .eq('course_id', unitProgress.course_id);

              if (updateError) {
                errors.push(`Failed to update unit ${unitProgress.unit_id}: ${updateError.message}`);
              } else {
                backfilledCount++;
                console.log(`Backfilled completion for hybrid unit: ${unitProgress.unit_id}`);
              }
            }
          }
        } catch (unitError) {
          errors.push(`Error processing unit ${unitProgress.unit_id}: ${unitError.message}`);
        }
      }

      if (backfilledCount > 0) {
        toast({
          title: "Progress Backfilled Successfully! 🎉",
          description: `Updated ${backfilledCount} unit completions. ${errors.length > 0 ? `${errors.length} errors occurred.` : ''}`,
        });
      }

      if (errors.length > 0) {
        console.error('Backfill errors:', errors);
      }

      return {
        backfilledCount,
        errors,
        totalProcessed: incompleteUnits.length
      };

    } catch (error) {
      console.error('Error during backfill:', error);
      toast({
        title: "Backfill Error",
        description: "Failed to backfill missing unit completions. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  return {
    backfillMissingUnitCompletions,
    processing
  };
};
