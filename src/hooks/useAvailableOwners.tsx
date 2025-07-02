
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AvailableOwner {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export const useAvailableOwners = () => {
  const { toast } = useToast();
  const [availableOwners, setAvailableOwners] = useState<AvailableOwner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAvailableOwners = async () => {
    try {
      setLoading(true);
      
      // First get all existing owner_ids from law_firms
      const { data: existingOwners, error: ownersError } = await supabase
        .from('law_firms')
        .select('owner_id')
        .not('owner_id', 'is', null);

      if (ownersError) throw ownersError;

      const existingOwnerIds = existingOwners?.map(o => o.owner_id) || [];

      // Get users with owner role who don't already own a law firm
      let query = supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          user_roles!inner (role)
        `)
        .eq('user_roles.role', 'owner')
        .eq('is_deleted', false);

      // Filter out existing owners if any exist
      if (existingOwnerIds.length > 0) {
        query = query.not('id', 'in', `(${existingOwnerIds.map(id => `'${id}'`).join(',')})`);
      }

      const { data: owners, error } = await query;

      if (error) throw error;

      setAvailableOwners(owners || []);
    } catch (error: any) {
      console.error('Error fetching available owners:', error);
      toast({
        title: "Error",
        description: "Failed to load available owners",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableOwners();
  }, []);

  return {
    availableOwners,
    loading,
    refetch: fetchAvailableOwners
  };
};
