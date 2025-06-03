
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import ActivityStatsCards from "./ActivityStatsCards";
import ActivityFilters from "./ActivityFilters";
import ActivityTable from "./ActivityTable";
import { useActivityData } from "./useActivityData";

const ActivityTrackingDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activityFilter, setActivityFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("today");

  const { activities, stats, loading, refetch } = useActivityData(dateFilter, activityFilter, searchTerm);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Activity Tracking</h2>
          <p className="text-gray-600">Monitor real-time user engagement and learning patterns</p>
        </div>
        <Button variant="outline" onClick={refetch}>
          <Download className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <ActivityStatsCards stats={stats} />

      <ActivityFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activityFilter={activityFilter}
        setActivityFilter={setActivityFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
      />

      <ActivityTable activities={activities} />
    </div>
  );
};

export default ActivityTrackingDashboard;
