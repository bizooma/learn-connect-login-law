
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEnrollmentCounts } from "@/hooks/useEnrollmentCounts";

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

interface Course {
  id: string;
  title: string;
  actual_enrollment_count: number;
}

export const useGlobalEvents = () => {
  const [events, setEvents] = useState<GlobalEvent[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { enrollmentCounts } = useEnrollmentCounts(false); // Disable realtime for events page

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .order('title');

      if (error) throw error;
      
      // Map courses with actual enrollment counts
      const coursesWithEnrollment: Course[] = (data || []).map(course => ({
        ...course,
        actual_enrollment_count: enrollmentCounts[course.id] || 0
      }));
      
      setCourses(coursesWithEnrollment);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      });
    }
  };

  // Update courses when enrollment counts change
  useEffect(() => {
    if (courses.length > 0) {
      const updatedCourses = courses.map(course => ({
        ...course,
        actual_enrollment_count: enrollmentCounts[course.id] || 0
      }));
      setCourses(updatedCourses);
    }
  }, [enrollmentCounts]);

  const fetchGlobalEvents = async () => {
    try {
      setLoading(true);
      const { data: eventsData, error: eventsError } = await supabase
        .from('global_events')
        .select('*')
        .order('event_date', { ascending: true });

      if (eventsError) throw eventsError;

      // Fetch associated courses for each event
      const eventsWithCourses = await Promise.all(
        (eventsData || []).map(async (event) => {
          const { data: courseData, error: courseError } = await supabase
            .from('global_event_courses')
            .select(`
              course_id,
              courses!inner(id, title)
            `)
            .eq('global_event_id', event.id);

          if (courseError) {
            console.error('Error fetching courses for event:', courseError);
            return { ...event, courses: [] };
          }

          return {
            ...event,
            courses: courseData?.map(item => item.courses) || []
          };
        })
      );

      setEvents(eventsWithCourses);
    } catch (error) {
      console.error('Error fetching global events:', error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createGlobalEvent = async (eventData: {
    title: string;
    description?: string;
    event_type: string;
    event_date: string;
    start_time?: string;
    end_time?: string;
    meeting_link?: string;
    course_ids: string[];
    target_roles: string[];
    target_email_domains: string[];
  }) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create events",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Create the global event
      const { data: eventResult, error: eventError } = await supabase
        .from('global_events')
        .insert({
          title: eventData.title,
          description: eventData.description,
          event_type: eventData.event_type,
          event_date: eventData.event_date,
          start_time: eventData.start_time,
          end_time: eventData.end_time,
          meeting_link: eventData.meeting_link,
          created_by: user.id,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Link the event to selected courses
      if (eventData.course_ids.length > 0) {
        const courseLinks = eventData.course_ids.map(courseId => ({
          global_event_id: eventResult.id,
          course_id: courseId,
        }));

        const { error: linkError } = await supabase
          .from('global_event_courses')
          .insert(courseLinks);

        if (linkError) throw linkError;
      }

      // Link the event to selected user roles
      if (eventData.target_roles.length > 0) {
        const roleLinks = eventData.target_roles.map(role => ({
          global_event_id: eventResult.id,
          role: role as 'admin' | 'owner' | 'student' | 'client' | 'free' | 'team_leader',
        }));

        const { error: roleLinkError } = await supabase
          .from('global_event_roles')
          .insert(roleLinks);

        if (roleLinkError) throw roleLinkError;
      }

      // Link the event to selected email domains
      if (eventData.target_email_domains.length > 0) {
        const emailDomainLinks = eventData.target_email_domains.map(domain => ({
          global_event_id: eventResult.id,
          email_domain: domain,
        }));

        const { error: emailDomainLinkError } = await supabase
          .from('global_event_email_domains')
          .insert(emailDomainLinks);

        if (emailDomainLinkError) throw emailDomainLinkError;
      }

      toast({
        title: "Success",
        description: "Global event created successfully",
      });

      await fetchGlobalEvents();
      return eventResult;
    } catch (error) {
      console.error('Error creating global event:', error);
      toast({
        title: "Error",
        description: "Failed to create global event",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteGlobalEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('global_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Global event deleted successfully",
      });

      await fetchGlobalEvents();
    } catch (error) {
      console.error('Error deleting global event:', error);
      toast({
        title: "Error",
        description: "Failed to delete global event",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchGlobalEvents();
  }, []);

  // Refetch courses when enrollment counts are loaded
  useEffect(() => {
    if (Object.keys(enrollmentCounts).length > 0) {
      fetchCourses();
    }
  }, [Object.keys(enrollmentCounts).length]);

  return {
    events,
    courses,
    loading,
    createGlobalEvent,
    deleteGlobalEvent,
    refreshEvents: fetchGlobalEvents,
  };
};
