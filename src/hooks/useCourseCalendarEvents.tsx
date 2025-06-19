
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { format, parseISO } from "date-fns";

type CourseCalendarEvent = Tables<'course_calendars'>;
type GlobalEvent = {
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
  is_global?: boolean; // Add flag to distinguish global events
};

type CombinedEvent = CourseCalendarEvent | GlobalEvent;

export const useCourseCalendarEvents = (courseId: string) => {
  const [events, setEvents] = useState<CombinedEvent[]>([]);
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
      
      // Fetch course-specific events
      const { data: courseEvents, error: courseError } = await supabase
        .from('course_calendars')
        .select('*')
        .eq('course_id', courseId)
        .order('event_date', { ascending: true });

      if (courseError) {
        console.error('useCourseCalendarEvents: Error fetching course calendar events:', courseError);
        throw courseError;
      }

      // Fetch global events for this course
      const { data: globalEventData, error: globalError } = await supabase
        .from('global_event_courses')
        .select(`
          global_events!inner(
            id,
            title,
            description,
            event_type,
            event_date,
            start_time,
            end_time,
            meeting_link,
            created_by,
            created_at,
            updated_at
          )
        `)
        .eq('course_id', courseId);

      if (globalError) {
        console.error('useCourseCalendarEvents: Error fetching global events:', globalError);
        // Don't throw here, just log the error and continue with course events only
      }

      // Combine and format events
      const allEvents: CombinedEvent[] = [
        ...(courseEvents || []),
        ...(globalEventData?.map(item => ({
          ...item.global_events,
          is_global: true
        })) || [])
      ];

      // Sort by date
      allEvents.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

      console.log('useCourseCalendarEvents: Combined events fetched:', allEvents);
      setEvents(allEvents);
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
