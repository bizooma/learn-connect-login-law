
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type LawFirm = Tables<'law_firms'> & {
  owner?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  employee_count?: number;
};

export const useLawFirms = () => {
  const { toast } = useToast();
  const [lawFirms, setLawFirms] = useState<LawFirm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLawFirms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch law firms with owner details and employee count
      const { data: lawFirmsData, error: lawFirmsError } = await supabase
        .from('law_firms')
        .select(`
          *,
          owner:profiles!law_firms_owner_id_fkey (
            email,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (lawFirmsError) {
        throw lawFirmsError;
      }

      // Get employee counts for each law firm
      const lawFirmsWithCounts = await Promise.all(
        (lawFirmsData || []).map(async (lawFirm) => {
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('law_firm_id', lawFirm.id)
            .eq('is_deleted', false);
          
          return {
            ...lawFirm,
            employee_count: count || 0
          };
        })
      );

      setLawFirms(lawFirmsWithCounts);
    } catch (error: any) {
      console.error('Error fetching law firms:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: "Failed to load law firms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLawFirms();
  }, []);

  return {
    lawFirms,
    loading,
    error,
    refetch: fetchLawFirms
  };
};
