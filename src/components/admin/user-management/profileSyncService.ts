
import { supabase } from "@/integrations/supabase/client";

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
  console.log('Calling sync-user-profiles edge function...');
  
  const { data, error } = await supabase.functions.invoke('sync-user-profiles', {
    method: 'POST'
  });

  if (error) {
    console.error('Error calling sync-user-profiles function:', error);
    throw new Error(`Failed to sync profiles: ${error.message}`);
  }

  if (!data.success) {
    console.error('Profile sync failed:', data.error);
    throw new Error(data.error || 'Profile sync failed');
  }

  console.log('Profile sync completed:', data);
  return data;
};
