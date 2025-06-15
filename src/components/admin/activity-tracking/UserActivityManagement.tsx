
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ActivityFiltersComponent from "./ActivityFilters";
import SessionsTable from "./SessionsTable";
import { useUserSessions } from "@/hooks/useUserSessions";
import { exportSessionsToCSV, exportStatsToCSV } from "@/utils/activityCsvExport";
import type { ActivityFilters } from "./types";

const UserActivityManagement = () => {
  const [filters, setFilters] = useState<ActivityFilters>({});
  const { sessions, stats, loading, refetch } = useUserSessions(filters);

  const handleExportSessionsCSV = () => {
    exportSessionsToCSV(sessions, filters);
  };

  const handleExportStatsCSV = () => {
    exportStatsToCSV(stats, filters);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">User Activity Management</h2>
        <p className="text-gray-600 mt-1">
          Track user login/logout sessions, course access, and download detailed activity reports.
        </p>
      </div>

      <ActivityFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        onExportCSV={handleExportSessionsCSV}
        loading={loading}
      />

      <Tabs defaultValue="sessions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sessions">Session Details</TabsTrigger>
          <TabsTrigger value="statistics">User Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sessions" className="space-y-4">
          <SessionsTable sessions={sessions} loading={loading} />
        </TabsContent>
        
        <TabsContent value="statistics" className="space-y-4">
          <div className="flex justify-end mb-4">
            <button
              onClick={handleExportStatsCSV}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              disabled={loading}
            >
              <span>Export Statistics CSV</span>
            </button>
          </div>
          
          <div className="grid gap-4">
            {stats.map((stat) => (
              <div key={stat.user_id} className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{stat.user_email}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-gray-500">Total Sessions:</span>
                        <div className="font-medium">{stat.total_sessions}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Time:</span>
                        <div className="font-medium">{Math.round(stat.total_time_seconds / 3600 * 10) / 10}h</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Avg Session:</span>
                        <div className="font-medium">{Math.round(stat.avg_session_duration / 60 * 10) / 10}m</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Last Activity:</span>
                        <div className="font-medium">{new Date(stat.last_activity).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserActivityManagement;
