
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Calendar, Clock, Users, ExternalLink } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format, parseISO } from "date-fns";

interface GlobalEvent {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  meeting_link?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  courses?: Array<{
    id: string;
    title: string;
  }>;
}

interface GlobalEventsListProps {
  events: GlobalEvent[];
  onDeleteEvent: (eventId: string) => Promise<void>;
  loading: boolean;
}

const GlobalEventsList = ({ events, onDeleteEvent, loading }: GlobalEventsListProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (eventId: string) => {
    setDeletingId(eventId);
    try {
      await onDeleteEvent(eventId);
    } finally {
      setDeletingId(null);
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800';
      case 'lecture': return 'bg-green-100 text-green-800';
      case 'workshop': return 'bg-purple-100 text-purple-800';
      case 'exam': return 'bg-red-100 text-red-800';
      case 'deadline': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-20 bg-gray-200"></CardHeader>
            <CardContent className="h-16 bg-gray-100"></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Global Events</h3>
          <p className="text-gray-500 text-center">
            Create your first global event to display it across multiple course calendars.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {events.map(event => (
        <Card key={event.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg mb-2">{event.title}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(parseISO(event.event_date), 'PPP')}
                  </div>
                  {event.start_time && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {event.start_time}
                      {event.end_time && ` - ${event.end_time}`}
                    </div>
                  )}
                  <Badge className={getEventTypeColor(event.event_type)}>
                    {event.event_type}
                  </Badge>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={deletingId === event.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Global Event</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{event.title}"? This will remove the event from all associated course calendars. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(event.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete Event
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>
          
          {(event.description || event.courses?.length || event.meeting_link) && (
            <CardContent className="pt-0">
              {event.description && (
                <p className="text-gray-600 mb-3">{event.description}</p>
              )}
              
              {event.courses && event.courses.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Courses ({event.courses.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {event.courses.map(course => (
                      <Badge key={course.id} variant="outline">
                        {course.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {event.meeting_link && (
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-gray-500" />
                  <a
                    href={event.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Join Meeting
                  </a>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

export default GlobalEventsList;
