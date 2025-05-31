
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { format, parseISO } from "date-fns";

type CourseCalendarEvent = Tables<'course_calendars'>;

interface CalendarEventCardProps {
  event: CourseCalendarEvent;
}

const CalendarEventCard = ({ event }: CalendarEventCardProps) => {
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'lecture':
        return 'bg-blue-100 text-blue-800';
      case 'assignment':
        return 'bg-red-100 text-red-800';
      case 'exam':
        return 'bg-purple-100 text-purple-800';
      case 'deadline':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium">{event.title}</h4>
          {event.description && (
            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
          )}
          {(event.start_time || event.end_time) && (
            <div className="flex items-center text-xs text-gray-500 mt-2">
              <Clock className="h-3 w-3 mr-1" />
              {event.start_time && format(parseISO(`2000-01-01T${event.start_time}`), 'h:mm a')}
              {event.start_time && event.end_time && ' - '}
              {event.end_time && format(parseISO(`2000-01-01T${event.end_time}`), 'h:mm a')}
            </div>
          )}
        </div>
        <Badge className={getEventTypeColor(event.event_type)}>
          {event.event_type}
        </Badge>
      </div>
    </Card>
  );
};

export default CalendarEventCard;
