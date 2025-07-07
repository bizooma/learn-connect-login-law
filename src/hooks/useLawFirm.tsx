
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { logger } from '@/utils/logger';

type LawFirm = Tables<'law_firms'>;

export const useLawFirm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lawFirm, setLawFirm] = useState<LawFirm | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrCreateLawFirm = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      logger.log('Fetching law firm for owner:', user.id);
      
      // First try to fetch existing law firm
      const { data, error } = await supabase
        .from('law_firms')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching law firm:', error);
        throw error;
      }

      if (data) {
        logger.log('Existing law firm found:', data);
        setLawFirm(data);
      } else {
        // No law firm exists, create a default one automatically
        logger.log('No law firm found, creating default law firm for owner:', user.id);
        
        const { data: newLawFirm, error: createError } = await supabase
          .from('law_firms')
          .insert({
            name: 'My Law Firm',
            total_seats: 4,
            owner_id: user.id,
            used_seats: 0
          })
          .select()
          .single();

        if (createError) {
          logger.error('Error creating default law firm:', createError);
          throw createError;
        }

        logger.log('Default law firm created:', newLawFirm);
        setLawFirm(newLawFirm);
        
        toast({
          title: "Welcome",
          description: "Your dashboard is ready to use!",
        });
      }
    } catch (error) {
      logger.error('Error in fetchOrCreateLawFirm:', error);
      toast({
        title: "Error",
        description: "Failed to initialize dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createLawFirm = async (name: string, totalSeats: number) => {
    if (!user?.id) return null;

    try {
      logger.log('Creating law firm:', { name, totalSeats, ownerId: user.id });

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
        logger.error('Error creating law firm:', error);
        throw error;
      }

      logger.log('Law firm created:', data);
      setLawFirm(data);
      
      toast({
        title: "Success",
        description: "Law firm created successfully",
      });

      return data;
    } catch (error) {
      logger.error('Error creating law firm:', error);
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
      logger.log('Updating law firm:', updates);

      const { data, error } = await supabase
        .from('law_firms')
        .update(updates)
        .eq('id', lawFirm.id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating law firm:', error);
        throw error;
      }

      logger.log('Law firm updated:', data);
      setLawFirm(data);
      
      toast({
        title: "Success",
        description: "Law firm updated successfully",
      });

      return data;
    } catch (error) {
      logger.error('Error updating law firm:', error);
      toast({
        title: "Error",
        description: "Failed to update law firm",
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    fetchOrCreateLawFirm();
  }, [user?.id]);

  return {
    lawFirm,
    loading,
    createLawFirm,
    updateLawFirm,
    refetch: fetchOrCreateLawFirm
  };
};
