
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ActivityLog } from "./types";
import { getActivityBadge, formatDuration } from "./utils";

interface ActivityTableProps {
  activities: ActivityLog[];
}

const ActivityTable = ({ activities }: ActivityTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Course/Content</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                  No activity data found
                </TableCell>
              </TableRow>
            ) : (
              activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {activity.profiles?.first_name && activity.profiles?.last_name
                          ? `${activity.profiles.first_name} ${activity.profiles.last_name}`
                          : 'Unknown User'
                        }
                      </div>
                      <div className="text-sm text-gray-500">{activity.profiles?.email || 'No email'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getActivityBadge(activity.activity_type)}>
                      {activity.activity_type.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {activity.courses?.title || activity.units?.title || '-'}
                  </TableCell>
                  <TableCell>{formatDuration(activity.duration_seconds)}</TableCell>
                  <TableCell>{format(new Date(activity.created_at), 'MMM d, HH:mm')}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ActivityTable;
