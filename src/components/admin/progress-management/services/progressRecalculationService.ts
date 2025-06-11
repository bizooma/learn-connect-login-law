
import { supabase } from "@/integrations/supabase/client";

export interface ProgressRecalculationResult {
  success: boolean;
  recordsUpdated: number;
  usersAffected: number;
  inconsistenciesFound: number;
  details: {
    updatedRecords: Array<{
      userId: string;
      courseId: string;
      oldProgress: number;
      newProgress: number;
      oldStatus: string;
      newStatus: string;
    }>;
    auditIds: string[];
    preservedManualWork: boolean;
  };
  errors: string[];
  warnings: string[];
}

// Type for the RPC response
interface AdminRecalculateProgressResponse {
  success: boolean;
  courses_updated?: number;
  users_affected?: number;
  details?: {
    audit_id?: string;
    errors?: string[];
    [key: string]: any;
  };
}

// Type for diagnosis response
interface DiagnosisResponse {
  total_users_with_progress: number;
  users_with_zero_progress: number;
  users_with_completed_units_but_zero_progress: number;
  sample_inconsistent_records: any[];
}

export const progressRecalculationService = {
  /**
   * Refined progress recalculation that preserves manual admin work
   */
  async recalculateProgressRefined(
    reason: string = 'Refined progress recalculation'
  ): Promise<ProgressRecalculationResult> {
    try {
      console.log('🔧 Starting refined progress recalculation...');
      
      // Use the existing admin function for safe recalculation
      const { data, error } = await supabase.rpc('admin_recalculate_all_progress', {
        p_reason: reason
      });

      if (error) {
        console.error('Error in refined recalculation:', error);
        return {
          success: false,
          recordsUpdated: 0,
          usersAffected: 0,
          inconsistenciesFound: 0,
          details: {
            updatedRecords: [],
            auditIds: [],
            preservedManualWork: false
          },
          errors: [error.message],
          warnings: []
        };
      }

      console.log('✅ Refined progress recalculation completed:', data);

      // Type assertion with proper checking - convert to unknown first
      const typedData = data as unknown as AdminRecalculateProgressResponse;

      return {
        success: typedData?.success || false,
        recordsUpdated: typedData?.courses_updated || 0,
        usersAffected: typedData?.users_affected || 0,
        inconsistenciesFound: typedData?.courses_updated || 0,
        details: {
          updatedRecords: [], // Would need to parse from details if needed
          auditIds: typedData?.details?.audit_id ? [typedData.details.audit_id] : [],
          preservedManualWork: true
        },
        errors: typedData?.details?.errors || [],
        warnings: []
      };

    } catch (error) {
      console.error('Error in refined progress recalculation:', error);
      return {
        success: false,
        recordsUpdated: 0,
        usersAffected: 0,
        inconsistenciesFound: 0,
        details: {
          updatedRecords: [],
          auditIds: [],
          preservedManualWork: false
        },
        errors: [`Recalculation failed: ${error.message}`],
        warnings: []
      };
    }
  },

  /**
   * Diagnose progress inconsistencies without making changes
   */
  async diagnoseInconsistencies() {
    try {
      console.log('🔍 Diagnosing progress inconsistencies...');
      
      const { data, error } = await supabase.rpc('diagnose_progress_inconsistencies');

      if (error) {
        console.error('Error diagnosing inconsistencies:', error);
        throw error;
      }

      // Type assertion for diagnosis data - convert to unknown first
      const diagnosisData = (data as unknown as DiagnosisResponse[])?.[0];

      return {
        success: true,
        totalUsers: diagnosisData?.total_users_with_progress || 0,
        usersWithZeroProgress: diagnosisData?.users_with_zero_progress || 0,
        inconsistentUsers: diagnosisData?.users_with_completed_units_but_zero_progress || 0,
        sampleRecords: diagnosisData?.sample_inconsistent_records || [],
        healthScore: diagnosisData?.users_with_completed_units_but_zero_progress > 0 ? 
          Math.max(0, 100 - (diagnosisData.users_with_completed_units_but_zero_progress / diagnosisData.total_users_with_progress * 100)) : 100
      };

    } catch (error) {
      console.error('Error diagnosing inconsistencies:', error);
      return {
        success: false,
        error: error.message,
        totalUsers: 0,
        usersWithZeroProgress: 0,
        inconsistentUsers: 0,
        sampleRecords: [],
        healthScore: 0
      };
    }
  },

  /**
   * Get progress integrity summary
   */
  async getProgressIntegritySummary() {
    try {
      // Get overall statistics
      const [progressResult, unitProgressResult, inconsistenciesResult] = await Promise.all([
        supabase.from('user_course_progress').select('id', { count: 'exact', head: true }),
        supabase.from('user_unit_progress').select('id', { count: 'exact', head: true }),
        this.diagnoseInconsistencies()
      ]);

      const totalProgress = progressResult.count || 0;
      const totalUnitProgress = unitProgressResult.count || 0;
      const inconsistencies = inconsistenciesResult.inconsistentUsers || 0;

      return {
        isHealthy: inconsistencies === 0,
        totalProgressRecords: totalProgress,
        totalUnitProgressRecords: totalUnitProgress,
        inconsistentRecords: inconsistencies,
        healthScore: inconsistenciesResult.healthScore || 0,
        lastChecked: new Date().toISOString(),
        summary: {
          status: inconsistencies === 0 ? 'HEALTHY' : 'NEEDS_ATTENTION',
          message: inconsistencies === 0 
            ? 'All progress data is consistent' 
            : `${inconsistencies} records need attention`,
          recommendedAction: inconsistencies > 0 
            ? 'Run refined progress recalculation'
            : 'No action needed'
        }
      };

    } catch (error) {
      console.error('Error getting progress integrity summary:', error);
      return {
        isHealthy: false,
        error: error.message,
        totalProgressRecords: 0,
        totalUnitProgressRecords: 0,
        inconsistentRecords: 0,
        healthScore: 0,
        lastChecked: new Date().toISOString(),
        summary: {
          status: 'ERROR',
          message: 'Unable to check progress integrity',
          recommendedAction: 'Check system logs'
        }
      };
    }
  }
};
