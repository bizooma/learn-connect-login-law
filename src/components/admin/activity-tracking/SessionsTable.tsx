
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Monitor, BookOpen } from "lucide-react";
import type { UserSession } from "./types";

interface SessionsTableProps {
  sessions: UserSession[];
  loading: boolean;
}

const SessionsTable = ({ sessions, loading }: SessionsTableProps) => {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="h-4 w-4" />;
      case 'unit':
        return <Clock className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getSessionTypeBadge = (type: string) => {
    const colors = {
      general: "default",
      course: "destructive",
      unit: "secondary"
    } as const;
    
    return (
      <Badge variant={colors[type as keyof typeof colors] || "default"} className="flex items-center space-x-1">
        {getSessionTypeIcon(type)}
        <span className="capitalize">{type}</span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading sessions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Sessions ({sessions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Session Type</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Entry Point</TableHead>
                <TableHead>Exit Point</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No sessions found for the selected criteria
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      {session.user_email || 'Unknown User'}
                    </TableCell>
                    <TableCell>
                      {getSessionTypeBadge(session.session_type)}
                    </TableCell>
                    <TableCell>
                      {session.course_title || (session.course_id ? 'Unknown Course' : 'N/A')}
                    </TableCell>
                    <TableCell>
                      {new Date(session.session_start).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {session.session_end ? new Date(session.session_end).toLocaleString() : 'Active'}
                    </TableCell>
                    <TableCell>
                      <span className={session.duration_seconds ? '' : 'text-gray-400'}>
                        {formatDuration(session.duration_seconds)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-32 truncate">
                      {session.entry_point || 'N/A'}
                    </TableCell>
                    <TableCell className="max-w-32 truncate">
                      {session.exit_point || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionsTable;
