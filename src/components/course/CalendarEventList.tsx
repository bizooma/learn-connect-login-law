
import { format } from "date-fns";
import CalendarEventCard from "./CalendarEventCard";

// Define a union type that includes both course calendar events and global events
type CombinedCalendarEvent = {
  id: string;
  title: string;
  description?: string | null;
  event_type: string;
  event_date: string;
  start_time?: string | null;
  end_time?: string | null;
  meeting_link?: string | null;
  created_at: string;
  updated_at: string;
  course_id?: string;
  is_global?: boolean;
};

interface CalendarEventListProps {
  selectedDate: Date | undefined;
  selectedEvents: CombinedCalendarEvent[];
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
