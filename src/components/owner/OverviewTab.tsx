
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, CheckCircle } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { useEmployees } from "@/hooks/useEmployees";

type LawFirm = Tables<'law_firms'>;

interface OverviewTabProps {
  lawFirm: LawFirm;
}

const OverviewTab = ({ lawFirm }: OverviewTabProps) => {
  const { employees } = useEmployees(lawFirm.id);
  const usedSeats = employees.length;
  const availableSeats = lawFirm.total_seats - usedSeats;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usedSeats}</div>
            <p className="text-xs text-muted-foreground">
              of {lawFirm.total_seats} available seats
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Seats</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableSeats}</div>
            <p className="text-xs text-muted-foreground">
              seats remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calendar Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              events this month
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome to Your Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Your law firm dashboard is ready! You can add up to {lawFirm.total_seats} team members 
            and manage your calendar events.
          </p>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Next steps:</strong>
            </p>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>Add team members in the "Team Members" tab</li>
              <li>Create calendar events in the "Calendar" tab</li>
              <li>Manage your team's training and progress</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewTab;
