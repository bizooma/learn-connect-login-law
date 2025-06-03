
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";
import EnhancedCalendarEventDialog from "./EnhancedCalendarEventDialog";
import CalendarEventList from "./CalendarEventList";
import CalendarControls from "./CalendarControls";
import { useCourseCalendarEvents } from "@/hooks/useCourseCalendarEvents";
import { useAuth } from "@/hooks/useAuth";

interface CourseCalendarProps {
  courseId: string;
  isAdmin?: boolean;
}

const CourseCalendar = ({ courseId, isAdmin = false }: CourseCalendarProps) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const {
    loading,
    fetchEvents,
    getEventDates,
    getMeetingDates,
    getSelectedEvents
  } = useCourseCalendarEvents(courseId);

  console.log('CourseCalendar: Component rendered with:', {
    isAdmin,
    courseId,
    user: user,
    userId: user?.id,
    userEmail: user?.email,
    isAuthenticated: !!user
  });

  const selectedEvents = getSelectedEvents(selectedDate);

  if (loading) {
    console.log('CourseCalendar: Showing loading state');
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2" />
            Course Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  console.log('CourseCalendar: Rendering calendar. Admin button should be visible:', isAdmin);
  console.log('CourseCalendar: Final render state:', {
    isAdmin,
    user: user,
    userId: user?.id,
    isAuthenticated: !!user
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2" />
            Course Calendar & Meetings
          </CardTitle>
          {isAdmin && (
            <EnhancedCalendarEventDialog courseId={courseId} onEventAdded={fetchEvents} />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CalendarControls
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
            eventDates={getEventDates()}
            meetingDates={getMeetingDates()}
          />
          <div>
            <CalendarEventList 
              selectedDate={selectedDate}
              selectedEvents={selectedEvents}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseCalendar;
