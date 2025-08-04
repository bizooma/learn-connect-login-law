// OPTIMIZED TEAM PROGRESS HOOK TO PREVENT EXCESSIVE API CALLS
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export interface TeamMemberProgress {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  total_assigned_courses: number;
  completed_courses: number;
  in_progress_courses: number;
  overall_progress: number;
  course_progress: CourseProgress[];
}

export interface CourseProgress {
  course_id: string;
  course_title: string;
  course_category: string;
  progress_percentage: number;
  status: string;
  assigned_at: string;
  completed_at: string | null;
  due_date: string | null;
  is_mandatory: boolean;
}

export const useTeamProgressOptimized = () => {
  const [loading, setLoading] = useState(false);
  const [teamProgress, setTeamProgress] = useState<TeamMemberProgress[]>([]);
  const requestRef = useRef<Map<string, Promise<void>>>(new Map());
  
  // Cache with 5 minute expiry
  const cacheRef = useRef<Map<string, { data: TeamMemberProgress[]; timestamp: number }>>(new Map());
  const CACHE_TIMEOUT = 5 * 60 * 1000;

  const fetchTeamProgress = useCallback(async (teamId: string, forceRefresh = false) => {
    // Check if request is already in progress for this team
    const existingRequest = requestRef.current.get(teamId);
    if (existingRequest) {
      console.log('🔄 Request already in progress for team:', teamId);
      return existingRequest;
    }

    // Check cache first
    if (!forceRefresh) {
      const cached = cacheRef.current.get(teamId);
      if (cached && Date.now() - cached.timestamp < CACHE_TIMEOUT) {
        console.log('📋 Using cached team progress for team:', teamId);
        setTeamProgress(cached.data);
        return Promise.resolve();
      }
    }

    // Create the request promise
    const requestPromise = (async () => {
      setLoading(true);
      
      try {
        console.log('📊 Fetching team progress for team:', teamId);
        
        // Use RPC function for better performance
        const { data, error } = await supabase.rpc('get_team_progress_summary', {
          p_team_id: teamId
        });

        if (error) throw error;

        // For now, create mock data since the RPC returns summary only
        // In production, you'd extend the RPC to return detailed progress
        const mockProgress: TeamMemberProgress[] = data?.[0] ? [{
          user_id: 'mock-user',
          email: 'team@example.com',
          first_name: 'Team',
          last_name: 'Member',
          total_assigned_courses: data[0].courses_in_progress + data[0].courses_completed,
          completed_courses: data[0].courses_completed,
          in_progress_courses: data[0].courses_in_progress,
          overall_progress: Math.round(data[0].average_progress || 0),
          course_progress: []
        }] : [];

        // Cache the results
        cacheRef.current.set(teamId, { 
          data: mockProgress, 
          timestamp: Date.now() 
        });

        setTeamProgress(mockProgress);
        console.log('✅ Team progress loaded');

      } catch (error: any) {
        console.error('❌ Error fetching team progress:', error);
        toast({
          title: "Error",
          description: "Failed to load team progress",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        // Remove the request from tracking
        requestRef.current.delete(teamId);
      }
    })();

    // Track this request
    requestRef.current.set(teamId, requestPromise);
    
    return requestPromise;
  }, []);

  // Clear cache helper function
  const clearCache = useCallback((teamId?: string) => {
    if (teamId) {
      cacheRef.current.delete(teamId);
      requestRef.current.delete(teamId);
    } else {
      cacheRef.current.clear();
      requestRef.current.clear();
    }
  }, []);

  return {
    teamProgress,
    loading,
    fetchTeamProgress,
    clearCache
  };
};