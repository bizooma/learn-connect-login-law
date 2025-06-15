
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
      
      let query = supabase
        .from('user_sessions')
        .select(`
          *,
          profiles!user_sessions_user_id_fkey(email),
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

      const { data, error } = await query.limit(1000);

      if (error) throw error;

      const formattedSessions = data?.map(session => ({
        ...session,
        user_email: session.profiles?.email,
        course_title: session.courses?.title
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
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_session_stats', {
        p_user_id: filters.userId || null,
        p_start_date: filters.startDate || null,
        p_end_date: filters.endDate || null
      });

      if (error) throw error;
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
    fetchSessions();
    fetchStats();
  }, [filters]);

  return {
    sessions,
    stats,
    loading,
    refetch: () => {
      fetchSessions();
      fetchStats();
    }
  };
};
