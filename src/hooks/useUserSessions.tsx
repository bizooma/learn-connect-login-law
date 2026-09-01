
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

const DEFAULT_PAGE_SIZE = 25;
const EXPORT_BATCH_SIZE = 1000;
const EXPORT_MAX_ROWS = 50000;

export const useUserSessions = (filters: ActivityFilters = {}) => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [stats, setStats] = useState<SessionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
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

  // Apply the shared (non-search) filters to any user_sessions query
  const applyBaseFilters = (query: any, smartFilters: ActivityFilters) => {
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
    return query;
  };

  // Resolve a search term into an `.or()` clause against user_sessions columns.
  // Email lives on profiles and title on courses, so those are resolved to ids first.
  const buildSearchClause = async (searchTerm?: string): Promise<string | null> => {
    const term = searchTerm?.trim();
    if (!term) return null;

    const escaped = term.replace(/[%,()]/g, '');
    if (!escaped) return null;

    const [{ data: profileMatches }, { data: courseMatches }] = await Promise.all([
      supabase.from('profiles').select('id').ilike('email', `%${escaped}%`).limit(1000),
      supabase.from('courses').select('id').ilike('title', `%${escaped}%`).limit(1000)
    ]);

    const clauses: string[] = [
      `entry_point.ilike.%${escaped}%`,
      `exit_point.ilike.%${escaped}%`
    ];

    const userIds = (profileMatches || []).map((p: any) => p.id);
    if (userIds.length > 0) {
      clauses.push(`user_id.in.(${userIds.join(',')})`);
    }
    const courseIds = (courseMatches || []).map((c: any) => c.id);
    if (courseIds.length > 0) {
      clauses.push(`course_id.in.(${courseIds.join(',')})`);
    }

    return clauses.join(',');
  };

  // Attach user emails / course titles to raw session rows
  const enrichSessions = async (sessionsData: any[]): Promise<UserSession[]> => {
    const userIds = Array.from(new Set(sessionsData.map(s => s.user_id).filter(Boolean)));

    const emailMap = new Map<string, string>();
    // .in() has practical limits, chunk the lookup
    for (let i = 0; i < userIds.length; i += 500) {
      const chunk = userIds.slice(i, i + 500);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', chunk);
      if (profilesError) throw profilesError;
      profilesData?.forEach(profile => emailMap.set(profile.id, profile.email));
    }

    return sessionsData.map(session => ({
      ...session,
      user_email: emailMap.get(session.user_id),
      course_title: session.courses?.title,
      session_type: session.session_type as 'general' | 'course' | 'unit',
      metadata: (session.metadata as Record<string, any>) || {}
    }));
  };

  const fetchSessions = async (page: number = 1, pageSize: number = DEFAULT_PAGE_SIZE) => {
    try {
      setLoading(true);
      const smartFilters = getSmartFilters(filters);
      const searchClause = await buildSearchClause(smartFilters.searchTerm);

      // First get the total count (same conditions as the data query)
      let countQuery = supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true });
      countQuery = applyBaseFilters(countQuery, smartFilters);
      if (searchClause) countQuery = countQuery.or(searchClause);

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
      query = applyBaseFilters(query, smartFilters);
      if (searchClause) query = query.or(searchClause);

      const { data: sessionsData, error: sessionsError } = await query;
      if (sessionsError) throw sessionsError;

      const formattedSessions = await enrichSessions(sessionsData || []);

      setSessions(formattedSessions);
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
    } finally {
      setLoading(false);
    }
  };

  // Fetch every row matching the current filters (batched), for CSV export
  const fetchAllSessionsForExport = async (): Promise<UserSession[]> => {
    setExporting(true);
    try {
      const smartFilters = getSmartFilters(filters);
      const searchClause = await buildSearchClause(smartFilters.searchTerm);

      const rows: any[] = [];
      let offset = 0;
      let truncated = false;

      while (true) {
        let query = supabase
          .from('user_sessions')
          .select(`
            *,
            courses(title)
          `)
          .order('session_start', { ascending: false })
          .range(offset, offset + EXPORT_BATCH_SIZE - 1);
        query = applyBaseFilters(query, smartFilters);
        if (searchClause) query = query.or(searchClause);

        const { data, error } = await query;
        if (error) throw error;

        const batch = data || [];
        rows.push(...batch);

        if (batch.length < EXPORT_BATCH_SIZE) break;

        offset += EXPORT_BATCH_SIZE;
        if (rows.length >= EXPORT_MAX_ROWS) {
          truncated = true;
          break;
        }
      }

      const capped = rows.slice(0, EXPORT_MAX_ROWS);
      const enriched = await enrichSessions(capped);

      if (truncated) {
        toast({
          title: "Export truncated",
          description: `Only the first ${EXPORT_MAX_ROWS.toLocaleString()} matching sessions were exported. Narrow the date range for a complete export.`,
          variant: "destructive",
        });
      }

      return enriched;
    } catch (error) {
      logger.error('Error exporting sessions:', error);
      toast({
        title: "Error",
        description: "Failed to export user sessions",
        variant: "destructive",
      });
      return [];
    } finally {
      setExporting(false);
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
    exporting,
    pagination,
    changePage,
    changePageSize,
    fetchAllSessionsForExport,
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
