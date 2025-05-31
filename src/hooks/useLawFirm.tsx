
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type LawFirm = Tables<'law_firms'>;

export const useLawFirm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lawFirm, setLawFirm] = useState<LawFirm | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLawFirm = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching law firm for owner:', user.id);
      
      const { data, error } = await supabase
        .from('law_firms')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching law firm:', error);
        throw error;
      }

      console.log('Law firm data:', data);
      setLawFirm(data);
    } catch (error) {
      console.error('Error fetching law firm:', error);
      toast({
        title: "Error",
        description: "Failed to load law firm data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createLawFirm = async (name: string, totalSeats: number) => {
    if (!user?.id) return null;

    try {
      console.log('Creating law firm:', { name, totalSeats, ownerId: user.id });

      const { data, error } = await supabase
        .from('law_firms')
        .insert({
          name,
          total_seats: totalSeats,
          owner_id: user.id,
          used_seats: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating law firm:', error);
        throw error;
      }

      console.log('Law firm created:', data);
      setLawFirm(data);
      
      toast({
        title: "Success",
        description: "Law firm created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating law firm:', error);
      toast({
        title: "Error",
        description: "Failed to create law firm",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateLawFirm = async (updates: Partial<LawFirm>) => {
    if (!lawFirm?.id) return null;

    try {
      console.log('Updating law firm:', updates);

      const { data, error } = await supabase
        .from('law_firms')
        .update(updates)
        .eq('id', lawFirm.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating law firm:', error);
        throw error;
      }

      console.log('Law firm updated:', data);
      setLawFirm(data);
      
      toast({
        title: "Success",
        description: "Law firm updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating law firm:', error);
      toast({
        title: "Error",
        description: "Failed to update law firm",
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    fetchLawFirm();
  }, [user?.id]);

  return {
    lawFirm,
    loading,
    createLawFirm,
    updateLawFirm,
    refetch: fetchLawFirm
  };
};
