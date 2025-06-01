
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { format, parseISO } from "date-fns";

type CourseCalendarEvent = Tables<'course_calendars'>;

export const useCourseCalendarEvents = (courseId: string) => {
  const [events, setEvents] = useState<CourseCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEvents = async () => {
    if (!courseId) {
      console.warn('useCourseCalendarEvents: No course ID provided');
      setLoading(false);
      return;
    }

    try {
      console.log('useCourseCalendarEvents: Fetching calendar events for course:', courseId);
      
      const { data, error } = await supabase
        .from('course_calendars')
        .select('*')
        .eq('course_id', courseId)
        .order('event_date', { ascending: true });

      if (error) {
        console.error('useCourseCalendarEvents: Error fetching calendar events:', error);
        throw error;
      }

      console.log('useCourseCalendarEvents: Calendar events fetched:', data);
      setEvents(data || []);
    } catch (error) {
      console.error('useCourseCalendarEvents: Error fetching course calendar events:', error);
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
          console.error('useCourseCalendarEvents: Error parsing event date:', event.event_date, dateError);
          return new Date();
        }
      }).filter(date => !isNaN(date.getTime()));
    } catch (error) {
      console.error('useCourseCalendarEvents: Error getting event dates:', error);
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
            console.error('useCourseCalendarEvents: Error parsing meeting date:', event.event_date, dateError);
            return new Date();
          }
        }).filter(date => !isNaN(date.getTime()));
    } catch (error) {
      console.error('useCourseCalendarEvents: Error getting meeting dates:', error);
      return [];
    }
  };

  const getSelectedEvents = (selectedDate: Date | undefined) => {
    if (!selectedDate) return [];
    
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      return events.filter(event => event.event_date === dateString);
    } catch (error) {
      console.error('useCourseCalendarEvents: Error filtering events by date:', error);
      return [];
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchEvents();
    }
  }, [courseId]);

  return {
    events,
    loading,
    fetchEvents,
    getEventDates,
    getMeetingDates,
    getSelectedEvents
  };
};
