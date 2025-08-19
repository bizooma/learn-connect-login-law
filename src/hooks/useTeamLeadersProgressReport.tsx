import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export interface TeamLeaderProgressData {
  team_leader_id: string;
  team_leader_name: string;
  team_leader_email: string;
  member_id: string;
  member_name: string;
  member_email: string;
  course_id: string;
  course_title: string;
  course_category: string;
  progress_percentage: number;
  status: string;
  assigned_at: string;
  due_date: string | null;
  completed_at: string | null;
}

export interface GroupedTeamData {
  teamLeaderId: string;
  teamLeaderName: string;
  teamLeaderEmail: string;
  members: {
    memberId: string;
    memberName: string;
    memberEmail: string;
    courses: {
      courseId: string;
      courseTitle: string;
      courseCategory: string;
      progress: number;
      status: string;
      assignedAt: string;
      dueDate: string | null;
      completedAt: string | null;
    }[];
  }[];
}

export const useTeamLeadersProgressReport = () => {
  const { toast } = useToast();
  const [reportData, setReportData] = useState<GroupedTeamData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      logger.log('Fetching team leaders progress report');

      const { data, error } = await supabase.rpc('get_team_leaders_progress_report');

      if (error) {
        logger.error('Error fetching team leaders progress report:', error);
        throw error;
      }

      // Group the flat data into hierarchical structure
      const grouped = groupReportData(data || []);
      setReportData(grouped);
      
      logger.log('Team leaders progress report fetched successfully:', grouped);
    } catch (error) {
      logger.error('Error fetching team leaders progress report:', error);
      toast({
        title: "Error",
        description: "Failed to load team leaders progress report",
        variant: "destructive",
      });
      setReportData([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const groupReportData = (data: TeamLeaderProgressData[]): GroupedTeamData[] => {
    const teamLeadersMap = new Map<string, GroupedTeamData>();

    data.forEach(row => {
      // Get or create team leader entry
      if (!teamLeadersMap.has(row.team_leader_id)) {
        teamLeadersMap.set(row.team_leader_id, {
          teamLeaderId: row.team_leader_id,
          teamLeaderName: row.team_leader_name,
          teamLeaderEmail: row.team_leader_email,
          members: []
        });
      }

      const teamLeader = teamLeadersMap.get(row.team_leader_id)!;

      // Find or create member entry
      let member = teamLeader.members.find(m => m.memberId === row.member_id);
      if (!member) {
        member = {
          memberId: row.member_id,
          memberName: row.member_name,
          memberEmail: row.member_email,
          courses: []
        };
        teamLeader.members.push(member);
      }

      // Add course to member
      member.courses.push({
        courseId: row.course_id,
        courseTitle: row.course_title,
        courseCategory: row.course_category,
        progress: row.progress_percentage,
        status: row.status,
        assignedAt: row.assigned_at,
        dueDate: row.due_date,
        completedAt: row.completed_at
      });
    });

    return Array.from(teamLeadersMap.values()).sort((a, b) => 
      a.teamLeaderName.localeCompare(b.teamLeaderName)
    );
  };

  return {
    reportData,
    loading,
    fetchReport
  };
};