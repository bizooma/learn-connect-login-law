
import { useEffect, useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Users, Settings } from "lucide-react";
import LawFirmSetup from "@/components/owner/LawFirmSetup";
import EmployeeManagement from "@/components/owner/EmployeeManagement";
import SeatManagement from "@/components/owner/SeatManagement";
import { useLawFirm } from "@/hooks/useLawFirm";

const OwnerDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isOwner, loading: roleLoading } = useUserRole();
  const { lawFirm, loading: lawFirmLoading } = useLawFirm();

  if (authLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user || !isOwner) {
    return <Navigate to="/" replace />;
  }

  if (lawFirmLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If no law firm exists, show setup
  if (!lawFirm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="mr-2 h-6 w-6" />
                Set Up Your Law Firm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Welcome to your owner dashboard! First, let's set up your law firm to start managing employees and seats.
              </p>
              <LawFirmSetup />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Owner Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your law firm and employees</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="seats">Seats</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Law Firm</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lawFirm.name}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lawFirm.used_seats}</div>
                <p className="text-xs text-muted-foreground">
                  of {lawFirm.total_seats} seats used
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Seats</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {lawFirm.total_seats - lawFirm.used_seats}
                </div>
                <p className="text-xs text-muted-foreground">
                  seats remaining
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="employees">
          <EmployeeManagement lawFirm={lawFirm} />
        </TabsContent>

        <TabsContent value="seats">
          <SeatManagement lawFirm={lawFirm} />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Law Firm Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <LawFirmSetup existingLawFirm={lawFirm} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OwnerDashboard;
