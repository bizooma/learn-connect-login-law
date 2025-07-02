
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

      if (ownersError) throw ownersError;

      // Get existing law firm owners
      const { data: existingOwners, error: lawFirmsError } = await supabase
        .from('law_firms')
        .select('owner_id')
        .not('owner_id', 'is', null);

      if (lawFirmsError) throw lawFirmsError;

      // Filter out owners who already have law firms
      const existingOwnerIds = new Set(existingOwners?.map(o => o.owner_id) || []);
      const availableOwnersList = allOwners?.filter(owner => !existingOwnerIds.has(owner.id)) || [];

      setAvailableOwners(availableOwnersList);
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
