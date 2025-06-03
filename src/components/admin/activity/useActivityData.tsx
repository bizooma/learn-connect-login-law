
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ActivityLog, ActivityStats, ActivityType } from "./types";

export const useActivityData = (dateFilter: string, activityFilter: string, searchTerm: string) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ActivityStats>({
    totalActivities: 0,
    activeUsers: 0,
    avgSessionDuration: 0,
    topActivity: ''
  });
  const [loading, setLoading] = useState(true);

  const fetchActivityData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build base query - fetch raw data first
      let query = supabase
        .from('user_activity_log')
        .select(`
          *
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply activity filter
      if (activityFilter !== 'all') {
        query = query.eq('activity_type', activityFilter as ActivityType);
      }

      // Apply date filter
      const now = new Date();
      switch (dateFilter) {
        case 'today':
          const today = format(now, 'yyyy-MM-dd');
          query = query.gte('created_at', `${today}T00:00:00.000Z`);
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          query = query.gte('created_at', weekAgo.toISOString());
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          query = query.gte('created_at', monthAgo.toISOString());
          break;
      }

      const { data: activityData, error } = await query;

      if (error) {
        console.error('Error fetching activity data:', error);
        setActivities([]);
        return;
      }

      // Fetch related data separately
      const userIds = [...new Set(activityData?.map(a => a.user_id) || [])];
      const courseIds = [...new Set(activityData?.filter(a => a.course_id).map(a => a.course_id) || [])];
      const unitIds = [...new Set(activityData?.filter(a => a.unit_id).map(a => a.unit_id) || [])];

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      // Fetch courses
      const { data: courses } = courseIds.length > 0 ? await supabase
        .from('courses')
        .select('id, title')
        .in('id', courseIds) : { data: [] };

      // Fetch units
      const { data: units } = unitIds.length > 0 ? await supabase
        .from('units')
        .select('id, title')
        .in('id', unitIds) : { data: [] };

      // Create lookup maps with proper typing
      const profileMap = new Map<string, {id: string, first_name?: string | null, last_name?: string | null, email?: string | null}>();
      profiles?.forEach(p => profileMap.set(p.id, p));

      const courseMap = new Map<string, {id: string, title: string}>();
      courses?.forEach(c => courseMap.set(c.id, c));

      const unitMap = new Map<string, {id: string, title: string}>();
      units?.forEach(u => unitMap.set(u.id, u));

      // Combine data
      const enrichedData: ActivityLog[] = (activityData || []).map(activity => ({
        ...activity,
        profiles: profileMap.get(activity.user_id) || null,
        courses: activity.course_id ? courseMap.get(activity.course_id) || null : null,
        units: activity.unit_id ? unitMap.get(activity.unit_id) || null : null
      }));

      // Filter by search term if provided
      let filteredData = enrichedData;
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredData = filteredData.filter(activity => {
          return (
            activity.profiles?.email?.toLowerCase().includes(searchLower) ||
            activity.profiles?.first_name?.toLowerCase().includes(searchLower) ||
            activity.profiles?.last_name?.toLowerCase().includes(searchLower) ||
            activity.courses?.title?.toLowerCase().includes(searchLower) ||
            activity.activity_type.toLowerCase().includes(searchLower)
          );
        });
      }

      setActivities(filteredData);

      // Calculate stats
      const totalActivities = filteredData.length;
      const activeUsers = new Set(filteredData.map(a => a.user_id)).size;
      const durationsWithValues = filteredData.filter(a => a.duration_seconds && a.duration_seconds > 0);
      const totalDuration = durationsWithValues.reduce((sum, a) => sum + (a.duration_seconds || 0), 0);
      const avgSessionDuration = durationsWithValues.length > 0 
        ? Math.round(totalDuration / durationsWithValues.length) 
        : 0;
      
      // Find most common activity
      const activityCounts = filteredData.reduce((acc, activity) => {
        acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topActivity = Object.entries(activityCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

      setStats({
        totalActivities,
        activeUsers,
        avgSessionDuration,
        topActivity
      });

    } catch (error) {
      console.error('Error fetching activity data:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, activityFilter, searchTerm]);

  useEffect(() => {
    fetchActivityData();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('activity-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activity_log'
        },
        () => {
          fetchActivityData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActivityData]);

  return {
    activities,
    stats,
    loading,
    refetch: fetchActivityData
  };
};
