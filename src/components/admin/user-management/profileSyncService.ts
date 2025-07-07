
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

export interface ProfileSyncResult {
  success: boolean;
  message: string;
  createdCount: number;
  details?: {
    totalAuthUsers: number;
    existingProfiles: number;
    usersWithoutProfiles: number;
    profilesCreated: number;
  };
  error?: string;
}

export const syncUserProfiles = async (): Promise<ProfileSyncResult> => {
  logger.log('Calling sync-user-profiles edge function...');
  
  const { data, error } = await supabase.functions.invoke('sync-user-profiles', {
    method: 'POST'
  });

  if (error) {
    logger.error('Error calling sync-user-profiles function:', error);
    throw new Error(`Failed to sync profiles: ${error.message}`);
  }

  if (!data.success) {
    logger.error('Profile sync failed:', data.error);
    throw new Error(data.error || 'Profile sync failed');
  }

  logger.log('Profile sync completed:', data);
  return data;
};
