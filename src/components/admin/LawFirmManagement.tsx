
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Building2, Users, TrendingUp } from 'lucide-react';
import { useLawFirms } from '@/hooks/useLawFirms';
import LawFirmCard from './law-firm-management/LawFirmCard';
import CreateLawFirmDialog from './law-firm-management/CreateLawFirmDialog';
import { Skeleton } from '@/components/ui/skeleton';

const LawFirmManagement = () => {
  const { lawFirms, loading, error } = useLawFirms();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            Error loading law firms: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Law Firm Management</h2>
          <p className="text-gray-600">Manage law firms, owners, and employee assignments</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Law Firm
        </Button>
      </div>

      {lawFirms.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No law firms yet</h3>
              <p className="text-gray-600 mb-4">
                Create the first law firm to start managing owners and employees.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Law Firm
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lawFirms.map((lawFirm) => (
            <LawFirmCard key={lawFirm.id} lawFirm={lawFirm} />
          ))}
        </div>
      )}

      <CreateLawFirmDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
};

export default LawFirmManagement;
