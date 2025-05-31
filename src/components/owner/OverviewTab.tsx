
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";

type LawFirm = Tables<'law_firms'>;

interface OverviewTabProps {
  lawFirm: LawFirm;
}

const OverviewTab = ({ lawFirm }: OverviewTabProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Seats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lawFirm.total_seats}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Used Seats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lawFirm.used_seats}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Available Seats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lawFirm.total_seats - lawFirm.used_seats}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Law Firm Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="font-medium">Name:</span> {lawFirm.name}
            </div>
            <div>
              <span className="font-medium">Created:</span>{" "}
              {new Date(lawFirm.created_at).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewTab;
