
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { format, parseISO } from "date-fns";
import { useLawFirm } from "@/hooks/useLawFirm";
import OwnerCalendarEventDialog from "./OwnerCalendarEventDialog";
import OwnerCalendarEventList from "./OwnerCalendarEventList";

type LawFirmCalendarEvent = Tables<'law_firm_calendars'>;

const CalendarTab = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<LawFirmCalendarEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<LawFirmCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { lawFirm } = useLawFirm();

  useEffect(() => {
    if (lawFirm?.id) {
      console.log('CalendarTab: Fetching events for law firm:', lawFirm.id);
      fetchEvents();
    }
  }, [lawFirm?.id]);

  useEffect(() => {
    if (selectedDate) {
      try {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        const dayEvents = events.filter(event => event.event_date === dateString);
        console.log('Selected date events:', { dateString, dayEvents });
        setSelectedEvents(dayEvents);
      } catch (error) {
        console.error('Error filtering events by date:', error);
        setSelectedEvents([]);
      }
    }
  }, [selectedDate, events]);

  const fetchEvents = async () => {
    if (!lawFirm?.id) {
      console.warn('CalendarTab: No law firm ID provided');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching calendar events for law firm:', lawFirm.id);
      
      const { data, error } = await supabase
        .from('law_firm_calendars')
        .select('*')
        .eq('law_firm_id', lawFirm.id)
        .order('event_date', { ascending: true });

      if (error) {
        console.error('Error fetching calendar events:', error);
        throw error;
      }

      console.log('Calendar events fetched:', data);
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
          return new Date(); // fallback to current date
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <CalendarIcon className="h-6 w-6 mr-2" />
            Law Firm Calendar
          </CardTitle>
          {lawFirm && (
            <OwnerCalendarEventDialog lawFirmId={lawFirm.id} onEventAdded={fetchEvents} />
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
            <OwnerCalendarEventList 
              selectedDate={selectedDate}
              selectedEvents={selectedEvents}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarTab;
