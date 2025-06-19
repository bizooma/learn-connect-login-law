
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, Globe } from "lucide-react";
import { format, parseISO } from "date-fns";
import MeetingLink from "@/components/calendar/MeetingLink";

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

interface CalendarEventCardProps {
  event: CombinedCalendarEvent;
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
      case 'meeting':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium">{event.title}</h4>
            {event.is_global && (
              <Globe className="h-4 w-4 text-blue-600" title="Global Event" />
            )}
          </div>
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
          {event.meeting_link && (
            <div className="mt-2">
              <MeetingLink url={event.meeting_link} />
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
