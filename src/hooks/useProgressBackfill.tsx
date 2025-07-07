
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

export const useProgressBackfill = () => {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const fixVideoCompletionIssues = async () => {
    setProcessing(true);
    
    try {
      logger.log('Starting video completion repair...');
      
      // Find videos watched 95%+ but not marked complete
      const { data: incompleteVideos, error } = await supabase
        .from('user_video_progress')
        .select('user_id, unit_id, course_id, watch_percentage')
        .gte('watch_percentage', 95)
        .eq('is_completed', false);

      if (error) {
        throw error;
      }

      logger.log(`Found ${incompleteVideos?.length || 0} videos to mark as complete`);

      if (!incompleteVideos || incompleteVideos.length === 0) {
        toast({
          title: "No Video Issues Found",
          description: "All high-completion videos are properly marked as complete.",
        });
        return { fixedCount: 0, errors: [], totalProcessed: 0 };
      }

      let fixedCount = 0;
      const errors: string[] = [];

      // Update videos to complete
      for (const video of incompleteVideos) {
        try {
          const { error: updateError } = await supabase
            .from('user_video_progress')
            .update({
              is_completed: true,
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', video.user_id)
            .eq('unit_id', video.unit_id)
            .eq('course_id', video.course_id);

          if (updateError) {
            errors.push(`Failed to update video for unit ${video.unit_id}: ${updateError.message}`);
          } else {
            fixedCount++;
            logger.log(`Fixed video completion for unit: ${video.unit_id}`);
          }
        } catch (videoError) {
          errors.push(`Error processing video for unit ${video.unit_id}: ${videoError.message}`);
        }
      }

      if (fixedCount > 0) {
        toast({
          title: "Video Completion Fixed! 🎉",
          description: `Updated ${fixedCount} video completions. ${errors.length > 0 ? `${errors.length} errors occurred.` : ''}`,
        });
      }

      return {
        fixedCount,
        errors,
        totalProcessed: incompleteVideos.length
      };

    } catch (error) {
      logger.error('Error during video completion repair:', error);
      toast({
        title: "Video Repair Error",
        description: "Failed to repair video completions. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  const backfillMissingUnitCompletions = async () => {
    setProcessing(true);
    
    try {
      logger.log('Starting backfill of missing unit completions...');
      
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

      logger.log(`Found ${incompleteUnits?.length || 0} units with completed quizzes but incomplete status`);

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
              logger.log(`Backfilled completion for quiz-only unit: ${unitProgress.unit_id}`);
            }
          } else {
            // For units with video, quiz completion is sufficient for unit completion
            // Mark unit as complete since quiz demonstrates knowledge mastery
            const { error: updateError } = await supabase
              .from('user_unit_progress')
              .update({
                completed: true,
                completed_at: unitProgress.quiz_completed_at || new Date().toISOString(),
                completion_method: 'quiz_completion_backfill',
                updated_at: new Date().toISOString()
              })
              .eq('user_id', unitProgress.user_id)
              .eq('unit_id', unitProgress.unit_id)
              .eq('course_id', unitProgress.course_id);

            if (updateError) {
              errors.push(`Failed to update unit ${unitProgress.unit_id}: ${updateError.message}`);
            } else {
              backfilledCount++;
              logger.log(`Backfilled completion for unit with video: ${unitProgress.unit_id}`);
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
        logger.error('Backfill errors:', errors);
      }

      return {
        backfilledCount,
        errors,
        totalProcessed: incompleteUnits.length
      };

    } catch (error) {
      logger.error('Error during backfill:', error);
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
    fixVideoCompletionIssues,
    processing
  };
};
