
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { UserSession, SessionStats, ActivityFilters } from "@/components/admin/activity-tracking/types";

export const useUserSessions = (filters: ActivityFilters = {}) => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [stats, setStats] = useState<SessionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSessions = async () => {
    try {
      setLoading(true);
      
      // First get sessions data
      let query = supabase
        .from('user_sessions')
        .select(`
          *,
          courses(title)
        `)
        .order('session_start', { ascending: false });

      // Apply filters
      if (filters.startDate) {
        query = query.gte('session_start', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('session_start', filters.endDate);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.courseId) {
        query = query.eq('course_id', filters.courseId);
      }
      if (filters.sessionType) {
        query = query.eq('session_type', filters.sessionType);
      }

      const { data: sessionsData, error: sessionsError } = await query.limit(1000);

      if (sessionsError) throw sessionsError;

      // Get user emails separately
      const userIds = Array.from(new Set(sessionsData?.map(s => s.user_id) || []));
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds)
        .eq('is_deleted', false);

      if (profilesError) throw profilesError;

      // Create a map for quick email lookup
      const emailMap = new Map();
      profilesData?.forEach(profile => {
        emailMap.set(profile.id, profile.email);
      });

      const formattedSessions = sessionsData?.map(session => ({
        ...session,
        user_email: emailMap.get(session.user_id),
        course_title: session.courses?.title,
        session_type: session.session_type as 'general' | 'course' | 'unit',
        metadata: (session.metadata as Record<string, any>) || {}
      })) || [];

      // Apply search filter if provided
      let filteredSessions = formattedSessions;
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filteredSessions = formattedSessions.filter(session => 
          session.user_email?.toLowerCase().includes(searchLower) ||
          session.course_title?.toLowerCase().includes(searchLower) ||
          session.entry_point?.toLowerCase().includes(searchLower) ||
          session.exit_point?.toLowerCase().includes(searchLower)
        );
      }

      setSessions(filteredSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user sessions",
        variant: "destructive",
      });
    }
  };

  const fetchStats = async () => {
    try {
      console.log('Fetching stats with filters:', filters);
      
      const { data, error } = await supabase.rpc('get_user_session_stats', {
        p_user_id: filters.userId || null,
        p_start_date: filters.startDate || null,
        p_end_date: filters.endDate || null
      });

      console.log('Stats RPC response:', { data, error });

      if (error) throw error;
      
      console.log('Setting stats:', data);
      setStats(data || []);
    } catch (error) {
      console.error('Error fetching session stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch session statistics",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchSessions(), fetchStats()]);
      setLoading(false);
    };
    
    fetchData();
  }, [filters]);

  return {
    sessions,
    stats,
    loading,
    refetch: () => {
      const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchSessions(), fetchStats()]);
        setLoading(false);
      };
      fetchData();
    }
  };
};
