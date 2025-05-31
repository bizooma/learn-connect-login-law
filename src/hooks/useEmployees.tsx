
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

interface EmployeeProfile extends Profile {
  roles?: Array<{ role: string }>;
}

export const useEmployees = (lawFirmId: string) => {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    if (!lawFirmId) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching employees for law firm:', lawFirmId);
      
      // Fetch profiles that belong to this law firm
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('law_firm_id', lawFirmId)
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching employees:', profilesError);
        throw profilesError;
      }

      console.log('Employee profiles fetched:', profiles);

      if (!profiles || profiles.length === 0) {
        setEmployees([]);
        setLoading(false);
        return;
      }

      // Fetch roles for these employees
      const userIds = profiles.map(p => p.id);
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) {
        console.error('Error fetching employee roles:', rolesError);
        throw rolesError;
      }

      console.log('Employee roles fetched:', userRoles);

      // Combine profiles with roles
      const employeesWithRoles = profiles.map(profile => {
        const profileRoles = userRoles?.filter(role => role.user_id === profile.id) || [];
        return {
          ...profile,
          roles: profileRoles.map(r => ({ role: r.role }))
        };
      });

      setEmployees(employeesWithRoles);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive",
      });
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [lawFirmId]);

  return {
    employees,
    loading,
    fetchEmployees
  };
};
