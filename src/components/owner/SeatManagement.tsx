
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Plus, Minus, Users } from "lucide-react";
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

  const seatUsagePercentage = (lawFirm.used_seats / lawFirm.total_seats) * 100;

  const handleUpdateSeats = async () => {
    if (newSeatCount < lawFirm.used_seats) {
      return; // Can't reduce below used seats
    }

    setLoading(true);
    await updateLawFirm({ total_seats: newSeatCount });
    setLoading(false);
  };

  const adjustSeats = (adjustment: number) => {
    const newCount = newSeatCount + adjustment;
    if (newCount >= lawFirm.used_seats && newCount >= 1) {
      setNewSeatCount(newCount);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Seat Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Usage */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Seat Usage</span>
            <span>{lawFirm.used_seats} / {lawFirm.total_seats} seats used</span>
          </div>
          <Progress value={seatUsagePercentage} className="w-full" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>{lawFirm.total_seats}</span>
          </div>
        </div>

        {/* Seat Adjustment */}
        <div className="space-y-4">
          <Label htmlFor="seat-count">Adjust Total Seats</Label>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustSeats(-1)}
              disabled={newSeatCount <= lawFirm.used_seats}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              id="seat-count"
              type="number"
              value={newSeatCount}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                if (value >= lawFirm.used_seats) {
                  setNewSeatCount(value);
                }
              }}
              className="w-24 text-center"
              min={lawFirm.used_seats}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustSeats(1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            Minimum: {lawFirm.used_seats} seats (current usage)
          </p>
        </div>

        {/* Update Button */}
        {newSeatCount !== lawFirm.total_seats && (
          <Button 
            onClick={handleUpdateSeats} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Updating..." : `Update to ${newSeatCount} Seats`}
          </Button>
        )}

        {/* Billing Information */}
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Billing Information</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Current plan:</span>
              <span>{lawFirm.total_seats} seats</span>
            </div>
            <div className="flex justify-between">
              <span>Available seats:</span>
              <span>{lawFirm.total_seats - lawFirm.used_seats}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Monthly cost:</span>
              <span>${(lawFirm.total_seats * 10).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SeatManagement;
