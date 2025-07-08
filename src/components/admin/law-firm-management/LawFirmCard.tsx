
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Crown, Settings, UserPlus } from 'lucide-react';
import LawFirmDetailsDialog from './LawFirmDetailsDialog';
import AssignEmployeeDialog from './AssignEmployeeDialog';
import { Tables } from '@/integrations/supabase/types';

type LawFirm = Tables<'law_firms'> & {
  owner?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  employee_count?: number;
};

interface LawFirmCardProps {
  lawFirm: LawFirm;
  onEmployeeAdded?: () => void;
}

const LawFirmCard = ({ lawFirm, onEmployeeAdded }: LawFirmCardProps) => {
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  
  const availableSeats = lawFirm.total_seats - lawFirm.used_seats;
  const seatUtilization = lawFirm.total_seats > 0 ? (lawFirm.used_seats / lawFirm.total_seats) * 100 : 0;
  
  const getOwnerDisplayName = () => {
    if (!lawFirm.owner) return 'Unknown Owner';
    const { first_name, last_name, email } = lawFirm.owner;
    if (first_name && last_name) {
      return `${first_name} ${last_name}`;
    }
    return email;
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">{lawFirm.name}</CardTitle>
            </div>
            <Badge variant={availableSeats > 0 ? "default" : "destructive"}>
              {lawFirm.used_seats}/{lawFirm.total_seats} seats
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <Crown className="h-4 w-4 mr-2" />
              <span>Owner: {getOwnerDisplayName()}</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-2" />
              <span>Employees: {lawFirm.employee_count || 0}</span>
            </div>
          </div>

          {/* Seat Usage Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Seat Usage</span>
              <span>{Math.round(seatUtilization)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  seatUtilization > 90 ? 'bg-red-500' : 
                  seatUtilization > 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(seatUtilization, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowDetailsDialog(true)}
              className="flex-1"
            >
              <Settings className="h-4 w-4 mr-1" />
              Manage
            </Button>
            <Button 
              size="sm" 
              onClick={() => setShowAssignDialog(true)}
              disabled={availableSeats <= 0}
              className="flex-1"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Add Employee
            </Button>
          </div>
        </CardContent>
      </Card>

      <LawFirmDetailsDialog
        lawFirm={lawFirm}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />

      <AssignEmployeeDialog
        lawFirm={lawFirm}
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        onEmployeeAdded={() => {
          onEmployeeAdded?.();
          setShowAssignDialog(false);
        }}
      />
    </>
  );
};

export default LawFirmCard;
