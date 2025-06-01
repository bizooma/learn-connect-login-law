import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { format, parseISO } from "date-fns";
import EnhancedCalendarEventDialog from "./EnhancedCalendarEventDialog";
import CalendarEventList from "./CalendarEventList";
import { useAuth } from "@/hooks/useAuth";

type CourseCalendarEvent = Tables<'course_calendars'>;

interface CourseCalendarProps {
  courseId: string;
  isAdmin?: boolean;
}

const CourseCalendar = ({ courseId, isAdmin = false }: CourseCalendarProps) => {
  // Add auth debugging
  const { user } = useAuth();
  
  console.log('CourseCalendar: Component rendered with:', {
    isAdmin,
    courseId,
    user: user,
    userId: user?.id,
    userEmail: user?.email,
    isAuthenticated: !!user
  });
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CourseCalendarEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<CourseCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log('CourseCalendar: isAdmin prop changed to:', isAdmin);
  }, [isAdmin]);

  useEffect(() => {
    if (courseId) {
      console.log('CourseCalendar: Fetching events for course:', courseId);
      fetchEvents();
    }
  }, [courseId]);

  useEffect(() => {
    if (selectedDate) {
      try {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        const dayEvents = events.filter(event => event.event_date === dateString);
        console.log('CourseCalendar: Selected date events:', { dateString, dayEvents });
        setSelectedEvents(dayEvents);
      } catch (error) {
        console.error('CourseCalendar: Error filtering events by date:', error);
        setSelectedEvents([]);
      }
    }
  }, [selectedDate, events]);

  const fetchEvents = async () => {
    if (!courseId) {
      console.warn('CourseCalendar: No course ID provided');
      setLoading(false);
      return;
    }

    try {
      console.log('CourseCalendar: Fetching calendar events for course:', courseId);
      
      const { data, error } = await supabase
        .from('course_calendars')
        .select('*')
        .eq('course_id', courseId)
        .order('event_date', { ascending: true });

      if (error) {
        console.error('CourseCalendar: Error fetching calendar events:', error);
        throw error;
      }

      console.log('CourseCalendar: Calendar events fetched:', data);
      setEvents(data || []);
    } catch (error) {
      console.error('CourseCalendar: Error fetching course calendar events:', error);
      toast({
        title: "Error",
        description: "Failed to load calendar events",
        variant: "destructive",
      });
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const getEventDates = () => {
    try {
      return events.map(event => {
        try {
          return parseISO(event.event_date);
        } catch (dateError) {
          console.error('CourseCalendar: Error parsing event date:', event.event_date, dateError);
          return new Date(); // fallback to current date
        }
      }).filter(date => !isNaN(date.getTime()));
    } catch (error) {
      console.error('CourseCalendar: Error getting event dates:', error);
      return [];
    }
  };

  const getMeetingDates = () => {
    try {
      return events
        .filter(event => ['meeting', 'lecture', 'workshop', 'presentation', 'review'].includes(event.event_type))
        .map(event => {
          try {
            return parseISO(event.event_date);
          } catch (dateError) {
            console.error('CourseCalendar: Error parsing meeting date:', event.event_date, dateError);
            return new Date();
          }
        }).filter(date => !isNaN(date.getTime()));
    } catch (error) {
      console.error('CourseCalendar: Error getting meeting dates:', error);
      return [];
    }
  };

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
            <div>
              <p className="text-xs text-green-600 mb-2">Admin controls visible</p>
              <EnhancedCalendarEventDialog courseId={courseId} onEventAdded={fetchEvents} />
            </div>
          )}
          {!isAdmin && (
            <p className="text-xs text-gray-500">Admin controls hidden (not admin)</p>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={{
                event: getEventDates(),
                meeting: getMeetingDates()
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
            <div className="mt-3 text-xs text-gray-500 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Meetings & Sessions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-200 border border-indigo-300 rounded"></div>
                <span>Other Events</span>
              </div>
            </div>
          </div>
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
