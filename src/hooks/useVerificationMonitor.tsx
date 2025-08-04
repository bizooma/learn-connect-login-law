import { useEffect, useRef, useState } from "react";
import { logger } from "@/utils/logger";

interface VerificationMetrics {
  videoPlayback: {
    sessionCount: number;
    crashCount: number;
    completionRate: number;
    avgWatchTime: number;
  };
  progressSaving: {
    attemptCount: number;
    successCount: number;
    failureCount: number;
    lastError?: string;
  };
  quizCompletion: {
    attemptCount: number;
    successCount: number;
    submissionFailures: number;
    loadingFailures: number;
  };
  authentication: {
    loginAttempts: number;
    loginFailures: number;
    sessionDropouts: number;
  };
  browserStability: {
    memoryWarnings: number;
    crashEvents: number;
    freezeEvents: number;
  };
}

export const useVerificationMonitor = () => {
  const metricsRef = useRef<VerificationMetrics>({
    videoPlayback: {
      sessionCount: 0,
      crashCount: 0,
      completionRate: 0,
      avgWatchTime: 0
    },
    progressSaving: {
      attemptCount: 0,
      successCount: 0,
      failureCount: 0
    },
    quizCompletion: {
      attemptCount: 0,
      successCount: 0,
      submissionFailures: 0,
      loadingFailures: 0
    },
    authentication: {
      loginAttempts: 0,
      loginFailures: 0,
      sessionDropouts: 0
    },
    browserStability: {
      memoryWarnings: 0,
      crashEvents: 0,
      freezeEvents: 0
    }
  });

  const [lastVerification, setLastVerification] = useState<Date | null>(null);

  // Video playback monitoring
  const trackVideoSession = (action: 'start' | 'complete' | 'crash', watchTime?: number) => {
    const metrics = metricsRef.current.videoPlayback;
    
    switch (action) {
      case 'start':
        metrics.sessionCount++;
        logger.info('📹 Video session started', { totalSessions: metrics.sessionCount });
        break;
      case 'complete':
        if (watchTime) {
          metrics.avgWatchTime = (metrics.avgWatchTime + watchTime) / 2;
        }
        metrics.completionRate = (metrics.sessionCount - metrics.crashCount) / metrics.sessionCount;
        logger.info('✅ Video completed', { 
          completionRate: `${(metrics.completionRate * 100).toFixed(1)}%`,
          avgWatchTime: `${metrics.avgWatchTime.toFixed(1)}s`
        });
        break;
      case 'crash':
        metrics.crashCount++;
        metrics.completionRate = (metrics.sessionCount - metrics.crashCount) / metrics.sessionCount;
        logger.warn('💥 Video crash detected', { 
          crashCount: metrics.crashCount,
          completionRate: `${(metrics.completionRate * 100).toFixed(1)}%`
        });
        break;
    }
  };

  // Progress saving monitoring
  const trackProgressSaving = (action: 'attempt' | 'success' | 'failure', error?: string) => {
    const metrics = metricsRef.current.progressSaving;
    
    switch (action) {
      case 'attempt':
        metrics.attemptCount++;
        break;
      case 'success':
        metrics.successCount++;
        logger.info('💾 Progress saved successfully', {
          successRate: `${((metrics.successCount / metrics.attemptCount) * 100).toFixed(1)}%`
        });
        break;
      case 'failure':
        metrics.failureCount++;
        metrics.lastError = error;
        logger.warn('⚠️ Progress save failed', {
          error,
          failureRate: `${((metrics.failureCount / metrics.attemptCount) * 100).toFixed(1)}%`
        });
        break;
    }
  };

  // Quiz completion monitoring
  const trackQuizCompletion = (action: 'attempt' | 'success' | 'submission_failure' | 'loading_failure') => {
    const metrics = metricsRef.current.quizCompletion;
    
    switch (action) {
      case 'attempt':
        metrics.attemptCount++;
        break;
      case 'success':
        metrics.successCount++;
        logger.info('🎯 Quiz completed successfully', {
          successRate: `${((metrics.successCount / metrics.attemptCount) * 100).toFixed(1)}%`
        });
        break;
      case 'submission_failure':
        metrics.submissionFailures++;
        logger.warn('📝 Quiz submission failed', {
          submissionFailures: metrics.submissionFailures
        });
        break;
      case 'loading_failure':
        metrics.loadingFailures++;
        logger.warn('⏳ Quiz loading failed', {
          loadingFailures: metrics.loadingFailures
        });
        break;
    }
  };

  // Authentication monitoring
  const trackAuthentication = (action: 'login_attempt' | 'login_failure' | 'session_dropout') => {
    const metrics = metricsRef.current.authentication;
    
    switch (action) {
      case 'login_attempt':
        metrics.loginAttempts++;
        break;
      case 'login_failure':
        metrics.loginFailures++;
        logger.warn('🔐 Login failure detected', {
          failureRate: `${((metrics.loginFailures / metrics.loginAttempts) * 100).toFixed(1)}%`
        });
        break;
      case 'session_dropout':
        metrics.sessionDropouts++;
        logger.warn('🚪 Session dropout detected', {
          dropouts: metrics.sessionDropouts
        });
        break;
    }
  };

  // Browser stability monitoring
  const trackBrowserStability = (action: 'memory_warning' | 'crash_event' | 'freeze_event') => {
    const metrics = metricsRef.current.browserStability;
    
    switch (action) {
      case 'memory_warning':
        metrics.memoryWarnings++;
        logger.warn('🧠 Memory warning', { warningCount: metrics.memoryWarnings });
        break;
      case 'crash_event':
        metrics.crashEvents++;
        logger.error('💥 Browser crash event', { crashCount: metrics.crashEvents });
        break;
      case 'freeze_event':
        metrics.freezeEvents++;
        logger.warn('🧊 Browser freeze event', { freezeCount: metrics.freezeEvents });
        break;
    }
  };

  // Generate verification report
  const generateVerificationReport = () => {
    const metrics = metricsRef.current;
    const now = new Date();
    
    const report = {
      timestamp: now.toISOString(),
      overallHealth: 'healthy' as 'healthy' | 'warning' | 'critical',
      issues: [] as string[],
      metrics: {
        videoStability: {
          completionRate: metrics.videoPlayback.completionRate,
          crashCount: metrics.videoPlayback.crashCount,
          status: metrics.videoPlayback.crashCount === 0 ? 'excellent' : 
                 metrics.videoPlayback.completionRate > 0.8 ? 'good' : 'needs_attention'
        },
        progressReliability: {
          successRate: metrics.progressSaving.attemptCount > 0 ? 
            metrics.progressSaving.successCount / metrics.progressSaving.attemptCount : 1,
          status: metrics.progressSaving.failureCount === 0 ? 'excellent' : 
                 (metrics.progressSaving.successCount / metrics.progressSaving.attemptCount) > 0.9 ? 'good' : 'needs_attention'
        },
        quizFunctionality: {
          successRate: metrics.quizCompletion.attemptCount > 0 ? 
            metrics.quizCompletion.successCount / metrics.quizCompletion.attemptCount : 1,
          status: (metrics.quizCompletion.submissionFailures + metrics.quizCompletion.loadingFailures) === 0 ? 'excellent' : 
                 (metrics.quizCompletion.successCount / metrics.quizCompletion.attemptCount) > 0.9 ? 'good' : 'needs_attention'
        },
        authenticationStability: {
          successRate: metrics.authentication.loginAttempts > 0 ? 
            (metrics.authentication.loginAttempts - metrics.authentication.loginFailures) / metrics.authentication.loginAttempts : 1,
          status: metrics.authentication.loginFailures === 0 ? 'excellent' : 
                 ((metrics.authentication.loginAttempts - metrics.authentication.loginFailures) / metrics.authentication.loginAttempts) > 0.9 ? 'good' : 'needs_attention'
        },
        browserStability: {
          crashCount: metrics.browserStability.crashEvents,
          memoryWarnings: metrics.browserStability.memoryWarnings,
          status: metrics.browserStability.crashEvents === 0 && metrics.browserStability.memoryWarnings < 3 ? 'excellent' :
                 metrics.browserStability.crashEvents < 2 && metrics.browserStability.memoryWarnings < 5 ? 'good' : 'needs_attention'
        }
      }
    };

    // Determine overall health
    const statusCounts = Object.values(report.metrics).reduce((acc, metric) => {
      acc[metric.status] = (acc[metric.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (statusCounts.needs_attention > 0) {
      report.overallHealth = 'critical';
      report.issues.push('Multiple systems need attention');
    } else if (statusCounts.good > statusCounts.excellent) {
      report.overallHealth = 'warning';
      report.issues.push('Some systems performing below optimal');
    }

    logger.info('📊 Verification Report Generated', report);
    setLastVerification(now);
    
    return report;
  };

  // Auto-generate reports every 30 minutes
  useEffect(() => {
    const reportInterval = setInterval(() => {
      generateVerificationReport();
    }, 30 * 60 * 1000);

    logger.info('🔍 Verification monitoring started');

    return () => {
      clearInterval(reportInterval);
    };
  }, []);

  return {
    trackVideoSession,
    trackProgressSaving,
    trackQuizCompletion,
    trackAuthentication,
    trackBrowserStability,
    generateVerificationReport,
    metrics: metricsRef.current,
    lastVerification
  };
};