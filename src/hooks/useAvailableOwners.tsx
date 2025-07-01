
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
      
      // Get users with owner role who don't already own a law firm
      const { data: owners, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          user_roles!inner (role)
        `)
        .eq('user_roles.role', 'owner')
        .eq('is_deleted', false)
        .not('id', 'in', `(
          SELECT owner_id FROM law_firms WHERE owner_id IS NOT NULL
        )`);

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
