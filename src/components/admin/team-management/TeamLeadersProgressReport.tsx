import { useEffect } from 'react';
import { Download, FileText, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTeamLeadersProgressReport } from '@/hooks/useTeamLeadersProgressReport';
import { exportToCSV } from '@/lib/csvUtils';
import { useUserRole } from '@/hooks/useUserRole';

const TeamLeadersProgressReport = () => {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { reportData, loading, fetchReport } = useTeamLeadersProgressReport();

  useEffect(() => {
    if (isAdmin && !roleLoading) {
      fetchReport();
    }
  }, [isAdmin, roleLoading, fetchReport]);

  const exportReportToCSV = () => {
    const csvData = reportData.flatMap(teamLeader =>
      teamLeader.members.flatMap(member =>
        member.courses.map(course => ({
          'Team Leader': teamLeader.teamLeaderName,
          'Team Leader Email': teamLeader.teamLeaderEmail,
          'Member Name': member.memberName,
          'Member Email': member.memberEmail,
          'Course Title': course.courseTitle,
          'Course Category': course.courseCategory,
          'Progress %': course.progress,
          'Status': course.status,
          'Assigned Date': new Date(course.assignedAt).toLocaleDateString(),
          'Due Date': course.dueDate ? new Date(course.dueDate).toLocaleDateString() : 'No due date',
          'Completed Date': course.completedAt ? new Date(course.completedAt).toLocaleDateString() : 'Not completed'
        }))
      )
    );

    const filename = `team-leaders-progress-report-${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(csvData, filename);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'not_started': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'not_started': return 'Not Started';
      default: return status;
    }
  };

  if (roleLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        {roleLoading ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div> : <p>Access denied. Admin role required.</p>}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Leaders Progress Report</h1>
          <p className="text-muted-foreground">Overview of all team members' course progress by team leader</p>
        </div>
        <Button onClick={exportReportToCSV} disabled={reportData.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Team Leaders</p>
                <p className="text-2xl font-bold">{reportData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-secondary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold">
                  {reportData.reduce((sum, tl) => sum + tl.members.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Course Assignments</p>
                <p className="text-2xl font-bold">
                  {reportData.reduce((sum, tl) => 
                    sum + tl.members.reduce((memberSum, member) => memberSum + member.courses.length, 0), 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Leaders Data */}
      {reportData.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Team Leaders Found</h3>
            <p className="text-muted-foreground">No team leaders with assigned members were found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {reportData.map((teamLeader) => (
            <Card key={teamLeader.teamLeaderId}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>{teamLeader.teamLeaderName}</span>
                  <Badge variant="secondary">{teamLeader.members.length} members</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{teamLeader.teamLeaderEmail}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamLeader.members.map((member) => (
                    <div key={member.memberId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{member.memberName}</h4>
                          <p className="text-sm text-muted-foreground">{member.memberEmail}</p>
                        </div>
                        <Badge variant="outline">{member.courses.length} courses</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {member.courses.map((course) => (
                          <div key={course.courseId} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h5 className="font-medium text-sm">{course.courseTitle}</h5>
                                <Badge className={getStatusColor(course.status)}>
                                  {getStatusText(course.status)}
                                </Badge>
                              </div>
                              <Progress value={course.progress} className="h-2 mb-1" />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{course.progress}% complete</span>
                                <span>
                                  {course.dueDate 
                                    ? `Due: ${new Date(course.dueDate).toLocaleDateString()}`
                                    : 'No due date'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamLeadersProgressReport;