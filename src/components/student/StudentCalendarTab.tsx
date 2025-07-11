import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { format, parseISO } from "date-fns";
import StudentCalendarEventList from "./StudentCalendarEventList";

type LawFirmCalendarEvent = Tables<'law_firm_calendars'>;

const StudentCalendarTab = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<LawFirmCalendarEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<LawFirmCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lawFirmId, setLawFirmId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserLawFirm();
    }
  }, [user]);

  useEffect(() => {
    if (lawFirmId) {
      fetchEvents();
    } else {
      setLoading(false);
    }
  }, [lawFirmId]);

  useEffect(() => {
    if (selectedDate) {
      try {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        const dayEvents = events.filter(event => event.event_date === dateString);
        setSelectedEvents(dayEvents);
      } catch (error) {
        console.error('Error filtering events by date:', error);
        setSelectedEvents([]);
      }
    }
  }, [selectedDate, events]);

  const fetchUserLawFirm = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('law_firm_id')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      setLawFirmId(data?.law_firm_id || null);
    } catch (error) {
      console.error('Error fetching user law firm:', error);
      setLawFirmId(null);
    }
  };

  const fetchEvents = async () => {
    if (!lawFirmId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('law_firm_calendars')
        .select('*')
        .eq('law_firm_id', lawFirmId)
        .order('event_date', { ascending: true });

      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching law firm calendar events:', error);
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
          console.error('Error parsing event date:', event.event_date, dateError);
          return new Date();
        }
      }).filter(date => !isNaN(date.getTime()));
    } catch (error) {
      console.error('Error getting event dates:', error);
      return [];
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="h-6 w-6 mr-2" />
            Law Firm Calendar
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

  if (!lawFirmId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="h-6 w-6 mr-2" />
            Law Firm Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No law firm calendar available</p>
            <p className="text-sm text-gray-500 mt-2">
              You need to be associated with a law firm to view calendar events.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CalendarIcon className="h-6 w-6 mr-2" />
          Law Firm Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={{
                event: getEventDates()
              }}
              modifiersStyles={{
                event: { 
                  backgroundColor: '#3b82f6', 
                  color: 'white',
                  fontWeight: 'bold'
                }
              }}
              className="rounded-md border"
            />
          </div>
          <div>
            <StudentCalendarEventList 
              selectedDate={selectedDate}
              selectedEvents={selectedEvents}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentCalendarTab;