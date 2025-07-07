import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

interface CompletionIssue {
  type: 'unit_completion' | 'video_completion' | 'progress_sync';
  userId: string;
  unitId?: string;
  courseId?: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export const useCompletionMonitoring = (enableAutoRepair: boolean = false) => {
  const [issues, setIssues] = useState<CompletionIssue[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const { toast } = useToast();

  // Monitor for completion issues every 5 minutes
  useEffect(() => {
    if (!isMonitoring) return;

    const checkInterval = setInterval(async () => {
      await scanForCompletionIssues();
    }, 5 * 60 * 1000); // 5 minutes

    // Initial scan
    scanForCompletionIssues();

    return () => clearInterval(checkInterval);
  }, [isMonitoring, enableAutoRepair]);

  const scanForCompletionIssues = async () => {
    try {
      logger.log('🔍 Scanning for completion issues...');
      const detectedIssues: CompletionIssue[] = [];

      // 1. Check for quiz completed but unit not complete
      const { data: unitIssues } = await supabase
        .from('user_unit_progress')
        .select(`
          user_id,
          unit_id,
          course_id,
          quiz_completed,
          completed,
          units!inner(title, video_url)
        `)
        .eq('quiz_completed', true)
        .eq('completed', false)
        .limit(10);

      if (unitIssues) {
        unitIssues.forEach(issue => {
          detectedIssues.push({
            type: 'unit_completion',
            userId: issue.user_id,
            unitId: issue.unit_id,
            courseId: issue.course_id,
            description: `Quiz completed but unit "${(issue.units as any)?.title}" not marked complete`,
            severity: 'medium'
          });
        });
      }

      // 2. Check for videos watched 95%+ but not marked complete
      const { data: videoIssues } = await supabase
        .from('user_video_progress')
        .select(`
          user_id,
          unit_id,
          course_id,
          watch_percentage,
          is_completed
        `)
        .gte('watch_percentage', 95)
        .eq('is_completed', false)
        .limit(10);

      if (videoIssues) {
        videoIssues.forEach(issue => {
          detectedIssues.push({
            type: 'video_completion',
            userId: issue.user_id,
            unitId: issue.unit_id,
            courseId: issue.course_id,
            description: `Video watched ${issue.watch_percentage}% but not marked complete`,
            severity: 'low'
          });
        });
      }

      // 3. Check for course progress inconsistencies
      const { data: progressIssues } = await supabase
        .from('user_course_progress')
        .select('user_id, course_id, progress_percentage, status')
        .eq('progress_percentage', 0)
        .in('status', ['in_progress', 'completed'])
        .limit(5);

      if (progressIssues) {
        progressIssues.forEach(issue => {
          detectedIssues.push({
            type: 'progress_sync',
            userId: issue.user_id,
            courseId: issue.course_id,
            description: `Course status "${issue.status}" but progress is 0%`,
            severity: 'high'
          });
        });
      }

      setIssues(detectedIssues);
      setLastCheck(new Date());

      // Auto-repair if enabled and critical issues found
      if (enableAutoRepair && detectedIssues.some(i => i.severity === 'high')) {
        await performAutoRepair(detectedIssues.filter(i => i.severity === 'high'));
      }

      if (detectedIssues.length > 0) {
        logger.log(`⚠️ Found ${detectedIssues.length} completion issues`);
      } else {
        logger.log('✅ No completion issues detected');
      }

    } catch (error) {
      logger.error('❌ Error scanning for completion issues:', error);
    }
  };

  const performAutoRepair = async (criticalIssues: CompletionIssue[]) => {
    try {
      logger.log('🔧 Performing auto-repair for critical issues...');
      
      for (const issue of criticalIssues) {
        if (issue.type === 'progress_sync' && issue.courseId) {
          // Trigger course progress recalculation
          await supabase.rpc('update_course_progress_reliable', {
            p_user_id: issue.userId,
            p_course_id: issue.courseId
          });
        }
      }

      toast({
        title: "Auto-Repair Completed",
        description: `Fixed ${criticalIssues.length} critical completion issues automatically.`,
      });

    } catch (error) {
      logger.error('❌ Auto-repair failed:', error);
      toast({
        title: "Auto-Repair Failed",
        description: "Could not automatically fix completion issues. Manual intervention required.",
        variant: "destructive",
      });
    }
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    logger.log('🟢 Completion monitoring started');
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    logger.log('🔴 Completion monitoring stopped');
  };

  const manualScan = () => {
    return scanForCompletionIssues();
  };

  const getIssueSummary = () => {
    const summary = {
      total: issues.length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length,
      affectedUsers: new Set(issues.map(i => i.userId)).size
    };
    return summary;
  };

  return {
    issues,
    isMonitoring,
    lastCheck,
    startMonitoring,
    stopMonitoring,
    manualScan,
    getIssueSummary
  };
};
