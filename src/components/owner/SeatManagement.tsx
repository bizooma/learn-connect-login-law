
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Plus, Minus } from "lucide-react";
import { useState } from "react";
import { Tables } from "@/integrations/supabase/types";
import { useLawFirm } from "@/hooks/useLawFirm";

type LawFirm = Tables<'law_firms'>;

interface SeatManagementProps {
  lawFirm: LawFirm;
}

const SeatManagement = ({ lawFirm }: SeatManagementProps) => {
  const { updateLawFirm } = useLawFirm();
  const [newSeatCount, setNewSeatCount] = useState(lawFirm.total_seats);
  const [loading, setLoading] = useState(false);

  const seatUtilization = (lawFirm.used_seats / lawFirm.total_seats) * 100;

  const handleUpdateSeats = async () => {
    if (newSeatCount < lawFirm.used_seats) {
      return; // Can't reduce below used seats
    }

    setLoading(true);
    try {
      await updateLawFirm({ total_seats: newSeatCount });
    } finally {
      setLoading(false);
    }
  };

  const adjustSeats = (delta: number) => {
    const newCount = Math.max(lawFirm.used_seats, newSeatCount + delta);
    setNewSeatCount(newCount);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Seat Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Seats Used</span>
            <span>{lawFirm.used_seats} of {lawFirm.total_seats}</span>
          </div>
          <Progress value={seatUtilization} className="w-full" />
          <p className="text-sm text-gray-500">
            {lawFirm.total_seats - lawFirm.used_seats} seats available
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Seats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seatCount">Total Seats</Label>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => adjustSeats(-1)}
                disabled={newSeatCount <= lawFirm.used_seats}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="seatCount"
                type="number"
                min={lawFirm.used_seats}
                value={newSeatCount}
                onChange={(e) => setNewSeatCount(parseInt(e.target.value) || lawFirm.used_seats)}
                className="text-center"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => adjustSeats(1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Minimum: {lawFirm.used_seats} (currently used seats)
            </p>
          </div>

          <Button 
            onClick={handleUpdateSeats}
            disabled={loading || newSeatCount === lawFirm.total_seats}
            className="w-full"
          >
            {loading ? "Updating..." : "Update Seat Count"}
          </Button>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900">Seat Pricing</h4>
            <p className="text-sm text-blue-700 mt-1">
              Additional seats: $10/month per seat
            </p>
            <p className="text-sm text-blue-700">
              Current plan: {lawFirm.total_seats} seats
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeatManagement;
