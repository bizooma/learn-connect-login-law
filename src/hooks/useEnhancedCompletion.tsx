import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { logger } from "@/utils/logger";

type Unit = Tables<'units'>;

interface CompletionAttempt {
  id: string;
  type: 'video' | 'quiz' | 'unit';
  unitId: string;
  courseId: string;
  userId: string;
  data: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

interface CompletionQueueItem extends CompletionAttempt {
  promise?: Promise<boolean>;
}

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2
};

export const useEnhancedCompletion = (retryConfig: Partial<RetryConfig> = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [failureQueue, setFailureQueue] = useState<CompletionQueueItem[]>([]);
  const retryTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

  // Initialize failure queue from localStorage on mount
  useEffect(() => {
    if (!user) return;
    
    const storedQueue = localStorage.getItem(`completion_queue_${user.id}`);
    if (storedQueue) {
      try {
        const parsedQueue = JSON.parse(storedQueue);
        setFailureQueue(parsedQueue);
        logger.log('📥 Loaded completion queue from storage:', parsedQueue.length, 'items');
      } catch (error) {
        logger.error('❌ Failed to parse stored completion queue:', error);
        localStorage.removeItem(`completion_queue_${user.id}`);
      }
    }
  }, [user]);

  // Save failure queue to localStorage whenever it changes
  useEffect(() => {
    if (!user || failureQueue.length === 0) return;
    
    try {
      localStorage.setItem(`completion_queue_${user.id}`, JSON.stringify(failureQueue));
      logger.log('💾 Saved completion queue to storage:', failureQueue.length, 'items');
    } catch (error) {
      logger.error('❌ Failed to save completion queue:', error);
    }
  }, [failureQueue, user]);

  // Calculate delay with exponential backoff
  const calculateDelay = useCallback((attempt: number): number => {
    const delay = Math.min(
      config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
      config.maxDelay
    );
    return delay + Math.random() * 1000; // Add jitter
  }, [config]);

  // Store completion attempt in localStorage for backup
  const storeCompletionAttempt = useCallback((attempt: CompletionAttempt) => {
    if (!user) return;
    
    try {
      const key = `completion_backup_${user.id}`;
      const stored = localStorage.getItem(key);
      const attempts = stored ? JSON.parse(stored) : [];
      
      // Keep only recent attempts (last 24 hours)
      const recentAttempts = attempts.filter(
        (a: CompletionAttempt) => Date.now() - a.timestamp < 24 * 60 * 60 * 1000
      );
      
      recentAttempts.push(attempt);
      localStorage.setItem(key, JSON.stringify(recentAttempts.slice(-50))); // Keep last 50
    } catch (error) {
      logger.error('❌ Failed to store completion attempt:', error);
    }
  }, [user]);

  // Add item to failure queue
  const addToFailureQueue = useCallback((attempt: CompletionAttempt) => {
    setFailureQueue(prev => {
      const existing = prev.find(item => 
        item.id === attempt.id || 
        (item.type === attempt.type && item.unitId === attempt.unitId)
      );
      
      if (existing) {
        return prev.map(item => 
          item.id === existing.id 
            ? { ...attempt, retries: item.retries + 1 }
            : item
        );
      }
      
      return [...prev, attempt];
    });
  }, []);

  // Remove item from failure queue
  const removeFromFailureQueue = useCallback((id: string) => {
    setFailureQueue(prev => prev.filter(item => item.id !== id));
    
    // Clear any pending retry timeout
    const timeout = retryTimeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      retryTimeouts.current.delete(id);
    }
  }, []);

  // Retry completion with exponential backoff
  const retryCompletion = useCallback(async (attempt: CompletionAttempt): Promise<boolean> => {
    if (attempt.retries >= config.maxRetries) {
      logger.error('❌ Max retries exceeded for completion:', attempt);
      
      toast({
        title: "Completion Save Failed",
        description: "Unable to save your progress after multiple attempts. Please try manually refreshing the page.",
        variant: "destructive",
      });
      
      removeFromFailureQueue(attempt.id);
      return false;
    }

    const delay = calculateDelay(attempt.retries);
    logger.log(`🔄 Retrying completion in ${delay}ms (attempt ${attempt.retries + 1}/${config.maxRetries}):`, attempt);

    return new Promise((resolve) => {
      const timeout = setTimeout(async () => {
        try {
          let success = false;
          
          switch (attempt.type) {
            case 'video':
              success = await performVideoCompletion(attempt.unitId, attempt.courseId, attempt.data);
              break;
            case 'quiz':
              success = await performQuizCompletion(
                attempt.data.quizId, 
                attempt.unitId, 
                attempt.courseId, 
                attempt.data.score, 
                attempt.data.answers
              );
              break;
            case 'unit':
              success = await performUnitCompletion(attempt.unitId, attempt.courseId, attempt.data.method);
              break;
          }

          if (success) {
            logger.log('✅ Retry successful:', attempt);
            removeFromFailureQueue(attempt.id);
            
            toast({
              title: "Progress Saved! ✅",
              description: "Your completion has been successfully saved.",
            });
            
            resolve(true);
          } else {
            // Increment retry count and try again
            const updatedAttempt = { ...attempt, retries: attempt.retries + 1 };
            addToFailureQueue(updatedAttempt);
            resolve(false);
          }
        } catch (error) {
          logger.error('❌ Retry failed:', error);
          const updatedAttempt = { ...attempt, retries: attempt.retries + 1 };
          addToFailureQueue(updatedAttempt);
          resolve(false);
        }
      }, delay);

      retryTimeouts.current.set(attempt.id, timeout);
    });
  }, [config.maxRetries, calculateDelay, removeFromFailureQueue, addToFailureQueue, toast]);

  // Process failure queue
  const processFailureQueue = useCallback(async () => {
    if (failureQueue.length === 0 || processing) return;

    logger.log('🔄 Processing failure queue:', failureQueue.length, 'items');

    for (const item of failureQueue) {
      if (!item.promise) {
        item.promise = retryCompletion(item);
      }
    }
  }, [failureQueue, processing, retryCompletion]);

  // Enhanced completion wrapper with error handling
  const withErrorHandling = useCallback(async <T extends any[]>(
    operation: (...args: T) => Promise<boolean>,
    fallbackData: CompletionAttempt,
    ...args: T
  ): Promise<boolean> => {
    try {
      // Store attempt for backup
      storeCompletionAttempt(fallbackData);
      
      const result = await operation(...args);
      
      if (result) {
        return true;
      } else {
        // Operation failed, add to retry queue
        addToFailureQueue(fallbackData);
        processFailureQueue();
        return false;
      }
    } catch (error) {
      logger.error('❌ Operation failed with error:', error);
      
      // Add to retry queue for later
      addToFailureQueue(fallbackData);
      processFailureQueue();
      
      return false;
    }
  }, [storeCompletionAttempt, addToFailureQueue, processFailureQueue]);

  // Core completion operations
  const performVideoCompletion = useCallback(async (
    unitId: string,
    courseId: string,
    data: { watchPercentage: number }
  ): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from('user_unit_progress')
      .upsert({
        user_id: user.id,
        unit_id: unitId,
        course_id: courseId,
        video_completed: true,
        video_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,unit_id,course_id'
      });

    return !error;
  }, [user]);

  const performQuizCompletion = useCallback(async (
    quizId: string,
    unitId: string,
    courseId: string,
    score: number,
    answers: any[]
  ): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from('user_unit_progress')
      .upsert({
        user_id: user.id,
        unit_id: unitId,
        course_id: courseId,
        quiz_completed: true,
        quiz_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,unit_id,course_id'
      });

    return !error;
  }, [user]);

  const performUnitCompletion = useCallback(async (
    unitId: string,
    courseId: string,
    completionMethod: string
  ): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from('user_unit_progress')
      .upsert({
        user_id: user.id,
        unit_id: unitId,
        course_id: courseId,
        completed: true,
        completed_at: new Date().toISOString(),
        completion_method: completionMethod,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,unit_id,course_id'
      });

    return !error;
  }, [user]);

  // Public API methods with enhanced error handling
  const markVideoComplete = useCallback(async (
    unitId: string,
    courseId: string,
    watchPercentage: number = 100
  ): Promise<boolean> => {
    if (!user || processing) return false;

    setProcessing(true);
    
    const attempt: CompletionAttempt = {
      id: `video_${unitId}_${Date.now()}`,
      type: 'video',
      unitId,
      courseId,
      userId: user.id,
      data: { watchPercentage },
      timestamp: Date.now(),
      retries: 0,
      maxRetries: config.maxRetries
    };

    try {
      const result = await withErrorHandling(
        performVideoCompletion,
        attempt,
        unitId,
        courseId,
        { watchPercentage }
      );

      if (result) {
        toast({
          title: "Video Completed! 🎥",
          description: "Your progress has been saved successfully.",
        });
      }

      return result;
    } finally {
      setProcessing(false);
    }
  }, [user, processing, config.maxRetries, withErrorHandling, toast]);

  const markQuizComplete = useCallback(async (
    quizId: string,
    unitId: string,
    courseId: string,
    score: number,
    answers: any[]
  ): Promise<boolean> => {
    if (!user || processing) return false;

    setProcessing(true);
    
    const attempt: CompletionAttempt = {
      id: `quiz_${unitId}_${Date.now()}`,
      type: 'quiz',
      unitId,
      courseId,
      userId: user.id,
      data: { quizId, score, answers },
      timestamp: Date.now(),
      retries: 0,
      maxRetries: config.maxRetries
    };

    try {
      const result = await withErrorHandling(
        performQuizCompletion,
        attempt,
        quizId,
        unitId,
        courseId,
        score,
        answers
      );

      if (result) {
        toast({
          title: "Quiz Completed! 📝",
          description: `Great job! You scored ${score}%`,
        });
      }

      return result;
    } finally {
      setProcessing(false);
    }
  }, [user, processing, config.maxRetries, withErrorHandling, toast]);

  const markUnitComplete = useCallback(async (
    unitId: string,
    courseId: string,
    completionMethod: string = 'manual'
  ): Promise<boolean> => {
    if (!user || processing) return false;

    setProcessing(true);
    
    const attempt: CompletionAttempt = {
      id: `unit_${unitId}_${Date.now()}`,
      type: 'unit',
      unitId,
      courseId,
      userId: user.id,
      data: { method: completionMethod },
      timestamp: Date.now(),
      retries: 0,
      maxRetries: config.maxRetries
    };

    try {
      const result = await withErrorHandling(
        performUnitCompletion,
        attempt,
        unitId,
        courseId,
        completionMethod
      );

      if (result) {
        toast({
          title: "Unit Completed! 🎉",
          description: "Great job! You've completed this unit.",
        });
      }

      return result;
    } finally {
      setProcessing(false);
    }
  }, [user, processing, config.maxRetries, withErrorHandling, toast]);

  // Manual retry trigger for failed completions
  const retryFailedCompletions = useCallback(async () => {
    await processFailureQueue();
  }, [processFailureQueue]);

  // Clear all failed completions
  const clearFailureQueue = useCallback(() => {
    failureQueue.forEach(item => {
      const timeout = retryTimeouts.current.get(item.id);
      if (timeout) {
        clearTimeout(timeout);
        retryTimeouts.current.delete(item.id);
      }
    });
    
    setFailureQueue([]);
    
    if (user) {
      localStorage.removeItem(`completion_queue_${user.id}`);
    }
  }, [failureQueue, user]);

  return {
    markVideoComplete,
    markQuizComplete,
    markUnitComplete,
    retryFailedCompletions,
    clearFailureQueue,
    processing,
    failureQueue: failureQueue.length,
    hasFailures: failureQueue.length > 0
  };
};
