
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Clock, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { format, parseISO } from "date-fns";

type CourseCalendarEvent = Tables<'course_calendars'>;

interface CourseCalendarProps {
  courseId: string;
  isAdmin?: boolean;
}

const CourseCalendar = ({ courseId, isAdmin = false }: CourseCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CourseCalendarEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<CourseCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const { toast } = useToast();

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    event_date: "",
    start_time: "",
    end_time: "",
    event_type: "general"
  });

  useEffect(() => {
    fetchEvents();
  }, [courseId]);

  useEffect(() => {
    if (selectedDate) {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const dayEvents = events.filter(event => event.event_date === dateString);
      setSelectedEvents(dayEvents);
    }
  }, [selectedDate, events]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('course_calendars')
        .select('*')
        .eq('course_id', courseId)
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching course calendar events:', error);
      toast({
        title: "Error",
        description: "Failed to load calendar events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.event_date) {
      toast({
        title: "Error",
        description: "Title and date are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('course_calendars')
        .insert({
          course_id: courseId,
          title: newEvent.title,
          description: newEvent.description,
          event_date: newEvent.event_date,
          start_time: newEvent.start_time || null,
          end_time: newEvent.end_time || null,
          event_type: newEvent.event_type,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event added successfully",
      });

      setNewEvent({
        title: "",
        description: "",
        event_date: "",
        start_time: "",
        end_time: "",
        event_type: "general"
      });
      setIsAddEventOpen(false);
      fetchEvents();
    } catch (error) {
      console.error('Error adding event:', error);
      toast({
        title: "Error",
        description: "Failed to add event",
        variant: "destructive",
      });
    }
  };

  const getEventDates = () => {
    return events.map(event => parseISO(event.event_date));
  };

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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2" />
            Course Calendar
          </CardTitle>
          {isAdmin && (
            <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Calendar Event</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      placeholder="Event title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      placeholder="Event description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="event_date">Date</Label>
                    <Input
                      id="event_date"
                      type="date"
                      value={newEvent.event_date}
                      onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_time">Start Time</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={newEvent.start_time}
                        onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_time">End Time</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={newEvent.end_time}
                        onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="event_type">Event Type</Label>
                    <Select
                      value={newEvent.event_type}
                      onValueChange={(value) => setNewEvent({ ...newEvent, event_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="lecture">Lecture</SelectItem>
                        <SelectItem value="assignment">Assignment</SelectItem>
                        <SelectItem value="exam">Exam</SelectItem>
                        <SelectItem value="deadline">Deadline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddEventOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddEvent}>
                      Add Event
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
            <h3 className="font-semibold mb-3">
              {selectedDate ? `Events for ${format(selectedDate, 'MMMM d, yyyy')}` : 'Select a date'}
            </h3>
            <div className="space-y-3">
              {selectedEvents.length > 0 ? (
                selectedEvents.map((event) => (
                  <Card key={event.id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{event.title}</h4>
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
                      </div>
                      <Badge className={getEventTypeColor(event.event_type)}>
                        {event.event_type}
                      </Badge>
                    </div>
                  </Card>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No events scheduled for this date.</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseCalendar;
