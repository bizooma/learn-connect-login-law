
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Users, MapPin, Video, Repeat } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { format, parseISO } from "date-fns";
import MeetingLink from "@/components/calendar/MeetingLink";

type CourseCalendarEvent = Tables<'course_calendars'>;

interface EnhancedCalendarEventCardProps {
  event: CourseCalendarEvent & {
    location?: string;
    participants?: string[];
    is_recurring?: boolean;
    recurring_pattern?: string;
  };
  isAdmin?: boolean;
}

const EnhancedCalendarEventCard = ({ event, isAdmin = false }: EnhancedCalendarEventCardProps) => {
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-100 text-blue-800';
      case 'lecture':
        return 'bg-green-100 text-green-800';
      case 'workshop':
        return 'bg-purple-100 text-purple-800';
      case 'presentation':
        return 'bg-orange-100 text-orange-800';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'assignment':
        return 'bg-red-100 text-red-800';
      case 'exam':
        return 'bg-gray-100 text-gray-800';
      case 'deadline':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting':
      case 'lecture':
      case 'workshop':
      case 'presentation':
      case 'review':
        return <Video className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium">{event.title}</h4>
            {event.is_recurring && (
              <div className="flex items-center text-xs text-gray-500">
                <Repeat className="h-3 w-3 mr-1" />
                {event.recurring_pattern}
              </div>
            )}
          </div>
          
          {event.description && (
            <p className="text-sm text-gray-600 mb-2">{event.description}</p>
          )}
          
          <div className="space-y-1">
            {(event.start_time || event.end_time) && (
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                {event.start_time && format(parseISO(`2000-01-01T${event.start_time}`), 'h:mm a')}
                {event.start_time && event.end_time && ' - '}
                {event.end_time && format(parseISO(`2000-01-01T${event.end_time}`), 'h:mm a')}
              </div>
            )}
            
            {event.location && (
              <div className="flex items-center text-xs text-gray-500">
                <MapPin className="h-3 w-3 mr-1" />
                {event.location}
              </div>
            )}
            
            {event.participants && event.participants.length > 0 && (
              <div className="flex items-center text-xs text-gray-500">
                <Users className="h-3 w-3 mr-1" />
                {event.participants.length} participant{event.participants.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          
          {event.meeting_link && (
            <div className="mt-3">
              <MeetingLink url={event.meeting_link} />
            </div>
          )}
          
          {isAdmin && (
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm">
                Edit
              </Button>
              <Button variant="outline" size="sm">
                Cancel Meeting
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <Badge className={getEventTypeColor(event.event_type)}>
            <div className="flex items-center gap-1">
              {getEventTypeIcon(event.event_type)}
              {event.event_type}
            </div>
          </Badge>
        </div>
      </div>
    </Card>
  );
};

export default EnhancedCalendarEventCard;
