
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
      console.log('Fetching available owners...');
      
      // Get all users with owner role first
      const { data: allOwners, error: ownersError } = await supabase
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

      if (ownersError) {
        console.error('Error fetching owners:', ownersError);
        throw ownersError;
      }

      console.log('All owners found:', allOwners?.length || 0, allOwners);

      // Get existing law firm owners
      const { data: existingOwners, error: lawFirmsError } = await supabase
        .from('law_firms')
        .select('owner_id')
        .not('owner_id', 'is', null);

      if (lawFirmsError) {
        console.error('Error fetching law firm owners:', lawFirmsError);
        throw lawFirmsError;
      }

      console.log('Existing law firm owners:', existingOwners?.length || 0, existingOwners);

      // Filter out owners who already have law firms
      const existingOwnerIds = new Set(existingOwners?.map(o => o.owner_id) || []);
      const availableOwnersList = allOwners?.filter(owner => !existingOwnerIds.has(owner.id)) || [];

      console.log('Available owners after filtering:', availableOwnersList.length, availableOwnersList);
      setAvailableOwners(availableOwnersList);
    } catch (error: any) {
      console.error('Error fetching available owners:', error);
      toast({
        title: "Error",
        description: `Failed to load available owners: ${error.message}`,
        variant: "destructive",
      });
      setAvailableOwners([]);
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
