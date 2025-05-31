import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useLawFirm } from "@/hooks/useLawFirm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Building2, Users, Settings, Calendar as CalendarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import LawFirmSetup from "@/components/owner/LawFirmSetup";
import EmployeeManagement from "@/components/owner/EmployeeManagement";
import SeatManagement from "@/components/owner/SeatManagement";

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isOwner, loading: roleLoading } = useUserRole();
  const { lawFirm, loading: lawFirmLoading } = useLawFirm();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Show loading state while checking authentication and role
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated or not an owner
  if (!user || !isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              You need owner privileges to access this dashboard.
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <Building2 className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Owner Dashboard</h1>
                  <p className="text-gray-600 mt-1">
                    {lawFirm ? `Managing ${lawFirm.name}` : "Manage your law firm and employees"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {lawFirm && (
                <div className="text-sm text-gray-500">
                  {lawFirm.used_seats}/{lawFirm.total_seats} seats used
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!lawFirm && !lawFirmLoading ? (
          // Show law firm setup if no law firm exists
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-6 w-6 mr-2" />
                Set Up Your Law Firm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Welcome! Let's start by setting up your law firm profile and purchasing employee seats.
              </p>
              <LawFirmSetup />
            </CardContent>
          </Card>
        ) : (
          // Show main dashboard with tabs
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center">
                <Building2 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="employees" className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Employees
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {lawFirm && (
                  <>
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
                  </>
                )}
              </div>

              {lawFirm && (
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
              )}
            </TabsContent>

            <TabsContent value="employees">
              {lawFirm ? (
                <EmployeeManagement lawFirmId={lawFirm.id} />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Please set up your law firm first.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="calendar">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CalendarIcon className="h-6 w-6 mr-2" />
                    Law Firm Calendar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="rounded-md border"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">
                            {selectedDate ? `Events for ${selectedDate.toLocaleDateString()}` : 'Select a date'}
                          </h3>
                          <div className="text-gray-500 text-center py-8">
                            <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Calendar functionality will be added here.</p>
                            <p className="text-sm">Schedule meetings, deadlines, and important dates.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              {lawFirm ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Law Firm Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <LawFirmSetup existingLawFirm={lawFirm} />
                    </CardContent>
                  </Card>
                  
                  <SeatManagement lawFirm={lawFirm} />
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Please set up your law firm first.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;
