
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

interface Certificate {
  id: string;
  course_id: string;
  course_title: string;
  certificate_number: string;
  issued_at: string;
  recipient_name: string;
}

export const useCertificates = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('user_certificates')
          .select('*')
          .eq('user_id', user.id)
          .order('issued_at', { ascending: false });

        if (error) throw error;

        setCertificates(data || []);
      } catch (err) {
        logger.error('Error fetching certificates:', err);
        setError('Failed to load certificates');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [user]);

  return { certificates, loading, error };
};
