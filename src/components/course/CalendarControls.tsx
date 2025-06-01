
import { Calendar } from "@/components/ui/calendar";
import CalendarLegend from "./CalendarLegend";

interface CalendarControlsProps {
  selectedDate: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  eventDates: Date[];
  meetingDates: Date[];
}

const CalendarControls = ({ selectedDate, onSelect, eventDates, meetingDates }: CalendarControlsProps) => {
  return (
    <div>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelect}
        modifiers={{
          event: eventDates,
          meeting: meetingDates
        }}
        modifiersStyles={{
          event: { 
            backgroundColor: '#e0e7ff', 
            color: 'black',
            fontWeight: 'bold'
          },
          meeting: { 
            backgroundColor: '#3b82f6', 
            color: 'white',
            fontWeight: 'bold'
          }
        }}
        className="rounded-md border"
      />
      <CalendarLegend />
    </div>
  );
};

export default CalendarControls;
