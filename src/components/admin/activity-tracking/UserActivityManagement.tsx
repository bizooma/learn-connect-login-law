
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ActivityFiltersComponent from "./ActivityFilters";
import SessionsTable from "./SessionsTable";
import SessionStatsCards from "./SessionStatsCards";
import { useUserSessions } from "@/hooks/useUserSessions";
import { exportSessionsToCSV, exportStatsToCSV } from "@/utils/activityCsvExport";
import type { ActivityFilters } from "./types";

const UserActivityManagement = () => {
  const [filters, setFilters] = useState<ActivityFilters>({});
  const { 
    sessions, 
    stats, 
    loading, 
    pagination, 
    changePage, 
    changePageSize, 
    refetch 
  } = useUserSessions(filters);

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

      {/* Summary Stats Cards */}
      <SessionStatsCards stats={stats} loading={loading} />

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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Course Session Tracking</h3>
            <p className="text-sm text-blue-700">
              📊 Course sessions show which specific courses students access and how long they spend in each course.
              <br />
              ⏱️ Duration is automatically calculated from session start to session end.
              <br />
              🎯 Filter by course or session type to analyze specific learning patterns.
              <br />
              🔴 Active sessions are highlighted in green - these are users currently online.
            </p>
          </div>
          <SessionsTable 
            sessions={sessions} 
            loading={loading} 
            pagination={pagination}
            onPageChange={changePage}
            onPageSizeChange={changePageSize}
          />
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
            {stats.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                <p>No session statistics available yet.</p>
                <p className="text-sm mt-2">Statistics will appear once users start accessing courses.</p>
              </div>
            )}
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
                        <span className="text-gray-500">Course Sessions:</span>
                        <div className="font-medium text-blue-600">{stat.course_sessions}</div>
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
