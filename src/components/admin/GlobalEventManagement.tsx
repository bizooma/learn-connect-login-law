
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Globe } from "lucide-react";
import { useGlobalEvents } from "@/hooks/useGlobalEvents";
import GlobalEventDialog from "./GlobalEventDialog";
import GlobalEventsList from "./GlobalEventsList";

const GlobalEventManagement = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { events, courses, loading, createGlobalEvent, deleteGlobalEvent } = useGlobalEvents();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe className="h-5 w-5 text-blue-600" />
            <CardTitle>Global Event Management</CardTitle>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Global Event
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Create events that will appear on multiple course calendars. These events are visible to all students enrolled in the selected courses.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Create an event and select which courses should display it</li>
              <li>• The event appears on each selected course's calendar</li>
              <li>• Students see the event when viewing their assigned course calendars</li>
              <li>• Perfect for announcements, deadlines, or meetings affecting multiple courses</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <GlobalEventsList
        events={events}
        onDeleteEvent={deleteGlobalEvent}
        loading={loading}
      />

      <GlobalEventDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        courses={courses}
        onSubmit={createGlobalEvent}
      />
    </div>
  );
};

export default GlobalEventManagement;
