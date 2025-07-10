
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { UserSession, SessionStats, ActivityFilters } from "@/components/admin/activity-tracking/types";
import { logger } from "@/utils/logger";

interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
}

export const useUserSessions = (filters: ActivityFilters = {}) => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [stats, setStats] = useState<SessionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 25,
    totalCount: 0
  });
  const { toast } = useToast();

  // Set smart defaults for filters
  const getSmartFilters = (filters: ActivityFilters): ActivityFilters => {
    const smartFilters = { ...filters };
    
    // Default to last 24 hours if no date range is specified
    if (!smartFilters.startDate && !smartFilters.endDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      smartFilters.startDate = yesterday.toISOString().split('T')[0];
    }
    
    return smartFilters;
  };

  const fetchSessions = async (page: number = 1, pageSize: number = 25) => {
    try {
      setLoading(true);
      const smartFilters = getSmartFilters(filters);
      
      // First get the total count
      let countQuery = supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true });

      // Apply filters to count query
      if (smartFilters.startDate) {
        countQuery = countQuery.gte('session_start', smartFilters.startDate);
      }
      if (smartFilters.endDate) {
        countQuery = countQuery.lte('session_start', smartFilters.endDate);
      }
      if (smartFilters.userId) {
        countQuery = countQuery.eq('user_id', smartFilters.userId);
      }
      if (smartFilters.courseId) {
        countQuery = countQuery.eq('course_id', smartFilters.courseId);
      }
      if (smartFilters.sessionType) {
        countQuery = countQuery.eq('session_type', smartFilters.sessionType);
      }

      const { count, error: countError } = await countQuery;
      if (countError) throw countError;

      // Now get the actual data with pagination
      let query = supabase
        .from('user_sessions')
        .select(`
          *,
          courses(title)
        `)
        .order('session_start', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      // Apply same filters to data query
      if (smartFilters.startDate) {
        query = query.gte('session_start', smartFilters.startDate);
      }
      if (smartFilters.endDate) {
        query = query.lte('session_start', smartFilters.endDate);
      }
      if (smartFilters.userId) {
        query = query.eq('user_id', smartFilters.userId);
      }
      if (smartFilters.courseId) {
        query = query.eq('course_id', smartFilters.courseId);
      }
      if (smartFilters.sessionType) {
        query = query.eq('session_type', smartFilters.sessionType);
      }

      const { data: sessionsData, error: sessionsError } = await query;

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
      if (smartFilters.searchTerm) {
        const searchLower = smartFilters.searchTerm.toLowerCase();
        filteredSessions = formattedSessions.filter(session => 
          session.user_email?.toLowerCase().includes(searchLower) ||
          session.course_title?.toLowerCase().includes(searchLower) ||
          session.entry_point?.toLowerCase().includes(searchLower) ||
          session.exit_point?.toLowerCase().includes(searchLower)
        );
      }

      setSessions(filteredSessions);
      setPagination(prev => ({
        ...prev,
        page,
        pageSize,
        totalCount: count || 0
      }));
    } catch (error) {
      logger.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user sessions",
        variant: "destructive",
      });
    }
  };

  const fetchStats = async () => {
    try {
      logger.log('Fetching stats with filters:', filters);
      
      const { data, error } = await supabase.rpc('get_user_session_stats', {
        p_user_id: filters.userId || null,
        p_start_date: filters.startDate || null,
        p_end_date: filters.endDate || null
      });

      logger.log('Stats RPC response:', { data, error });

      if (error) throw error;
      
      logger.log('Setting stats:', data);
      setStats(data || []);
    } catch (error) {
      logger.error('Error fetching session stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch session statistics",
        variant: "destructive",
      });
    }
  };

  const changePage = (newPage: number) => {
    fetchSessions(newPage, pagination.pageSize);
  };

  const changePageSize = (newPageSize: number) => {
    fetchSessions(1, newPageSize);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchSessions(1, pagination.pageSize), fetchStats()]);
      setLoading(false);
    };
    
    fetchData();
  }, [filters]);

  return {
    sessions,
    stats,
    loading,
    pagination,
    changePage,
    changePageSize,
    refetch: () => {
      const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchSessions(pagination.page, pagination.pageSize), fetchStats()]);
        setLoading(false);
      };
      fetchData();
    }
  };
};
