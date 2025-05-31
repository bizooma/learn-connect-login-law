
import { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";
import OwnerCalendarEventCard from "./OwnerCalendarEventCard";

type LawFirmCalendarEvent = Tables<'law_firm_calendars'>;

interface OwnerCalendarEventListProps {
  selectedDate: Date | undefined;
  selectedEvents: LawFirmCalendarEvent[];
}

const OwnerCalendarEventList = ({ selectedDate, selectedEvents }: OwnerCalendarEventListProps) => {
  return (
    <div>
      <h3 className="font-semibold mb-3">
        {selectedDate ? `Events for ${format(selectedDate, 'MMMM d, yyyy')}` : 'Select a date'}
      </h3>
      <div className="space-y-3">
        {selectedEvents.length > 0 ? (
          selectedEvents.map((event) => (
            <OwnerCalendarEventCard key={event.id} event={event} />
          ))
        ) : (
          <p className="text-gray-500 text-sm">No events scheduled for this date.</p>
        )}
      </div>
    </div>
  );
};

export default OwnerCalendarEventList;
