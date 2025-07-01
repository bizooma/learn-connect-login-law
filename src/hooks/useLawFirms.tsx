
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
      
      console.log('useLawFirms: Starting to fetch law firms');
      
      // First, fetch law firms without the problematic join
      const { data: lawFirmsData, error: lawFirmsError } = await supabase
        .from('law_firms')
        .select('*')
        .order('created_at', { ascending: false });

      if (lawFirmsError) {
        console.error('useLawFirms: Error fetching law firms:', lawFirmsError);
        throw lawFirmsError;
      }

      console.log('useLawFirms: Law firms data:', lawFirmsData);

      if (!lawFirmsData || lawFirmsData.length === 0) {
        console.log('useLawFirms: No law firms found');
        setLawFirms([]);
        return;
      }

      // Get owner details and employee counts separately
      const lawFirmsWithDetails = await Promise.all(
        lawFirmsData.map(async (lawFirm) => {
          try {
            // Get owner details
            const { data: ownerData, error: ownerError } = await supabase
              .from('profiles')
              .select('email, first_name, last_name')
              .eq('id', lawFirm.owner_id)
              .single();

            if (ownerError) {
              console.warn('useLawFirms: Error fetching owner for law firm:', lawFirm.id, ownerError);
            }

            // Get employee count
            const { count: employeeCount, error: countError } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
              .eq('law_firm_id', lawFirm.id)
              .eq('is_deleted', false);
            
            if (countError) {
              console.warn('useLawFirms: Error counting employees for law firm:', lawFirm.id, countError);
            }

            return {
              ...lawFirm,
              owner: ownerData || undefined,
              employee_count: employeeCount || 0
            };
          } catch (error) {
            console.error('useLawFirms: Error processing law firm:', lawFirm.id, error);
            return {
              ...lawFirm,
              owner: undefined,
              employee_count: 0
            };
          }
        })
      );

      console.log('useLawFirms: Law firms with details:', lawFirmsWithDetails);
      setLawFirms(lawFirmsWithDetails);
    } catch (error: any) {
      console.error('useLawFirms: Error in fetchLawFirms:', error);
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
