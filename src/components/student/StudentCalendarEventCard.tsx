import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { format, parseISO } from "date-fns";
import MeetingLink from "@/components/calendar/MeetingLink";

type LawFirmCalendarEvent = Tables<'law_firm_calendars'>;

interface StudentCalendarEventCardProps {
  event: LawFirmCalendarEvent;
}

const StudentCalendarEventCard = ({ event }: StudentCalendarEventCardProps) => {
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-100 text-blue-800';
      case 'deadline':
        return 'bg-red-100 text-red-800';
      case 'court_date':
        return 'bg-purple-100 text-purple-800';
      case 'training':
        return 'bg-green-100 text-green-800';
      case 'social':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (time: string) => {
    try {
      const date = parseISO(`2000-01-01T${time}`);
      return format(date, 'h:mm a');
    } catch (error) {
      return time;
    }
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-gray-900">{event.title}</h4>
          <Badge variant="secondary" className={getEventTypeColor(event.event_type)}>
            {event.event_type.replace('_', ' ')}
          </Badge>
        </div>
        
        {event.description && (
          <p className="text-sm text-gray-600">{event.description}</p>
        )}
        
        {(event.start_time || event.end_time) && (
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            {event.start_time && formatTime(event.start_time)}
            {event.start_time && event.end_time && ' - '}
            {event.end_time && formatTime(event.end_time)}
          </div>
        )}
        
        {event.meeting_link && (
          <MeetingLink url={event.meeting_link} />
        )}
      </div>
    </Card>
  );
};

export default StudentCalendarEventCard;