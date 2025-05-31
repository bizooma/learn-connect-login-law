
import { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";
import CalendarEventCard from "./CalendarEventCard";

type CourseCalendarEvent = Tables<'course_calendars'>;

interface CalendarEventListProps {
  selectedDate: Date | undefined;
  selectedEvents: CourseCalendarEvent[];
}

const CalendarEventList = ({ selectedDate, selectedEvents }: CalendarEventListProps) => {
  return (
    <div>
      <h3 className="font-semibold mb-3">
        {selectedDate ? `Events for ${format(selectedDate, 'MMMM d, yyyy')}` : 'Select a date'}
      </h3>
      <div className="space-y-3">
        {selectedEvents.length > 0 ? (
          selectedEvents.map((event) => (
            <CalendarEventCard key={event.id} event={event} />
          ))
        ) : (
          <p className="text-gray-500 text-sm">No events scheduled for this date.</p>
        )}
      </div>
    </div>
  );
};

export default CalendarEventList;
