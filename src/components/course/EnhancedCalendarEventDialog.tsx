
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Users, Clock, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { validateMeetingUrl } from "@/utils/meetingUtils";

interface Participant {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface EnhancedCalendarEventDialogProps {
  courseId: string;
  onEventAdded: () => void;
}

const EnhancedCalendarEventDialog = ({ courseId, onEventAdded }: EnhancedCalendarEventDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("meeting");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [location, setLocation] = useState("");
  const [sendNotifications, setSendNotifications] = useState(true);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState("weekly");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && courseId) {
      fetchCourseParticipants();
    }
  }, [open, courseId]);

  const fetchCourseParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('course_assignments')
        .select(`
          user_id,
          profiles!inner(id, email, first_name, last_name)
        `)
        .eq('course_id', courseId);

      if (error) throw error;

      const participantList = data?.map(assignment => ({
        id: assignment.user_id,
        email: assignment.profiles.email,
        first_name: assignment.profiles.first_name || '',
        last_name: assignment.profiles.last_name || ''
      })) || [];

      setParticipants(participantList);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setEventType("meeting");
    setSelectedDate(new Date());
    setStartTime("");
    setEndTime("");
    setMeetingLink("");
    setLocation("");
    setSendNotifications(true);
    setIsRecurring(false);
    setRecurringPattern("weekly");
    setSelectedParticipants([]);
  };

  const handleParticipantToggle = (participantId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(participantId) 
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !selectedDate) {
      toast({
        title: "Error",
        description: "Please fill in the required fields",
        variant: "destructive",
      });
      return;
    }

    if (meetingLink && !validateMeetingUrl(meetingLink)) {
      toast({
        title: "Error",
        description: "Please enter a valid meeting URL",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const eventData = {
        course_id: courseId,
        title: title.trim(),
        description: description.trim() || null,
        event_type: eventType,
        event_date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: startTime || null,
        end_time: endTime || null,
        meeting_link: meetingLink.trim() || null,
        location: location.trim() || null,
        participants: selectedParticipants,
        send_notifications: sendNotifications,
        is_recurring: isRecurring,
        recurring_pattern: isRecurring ? recurringPattern : null,
      };

      const { error } = await supabase
        .from('course_calendars')
        .insert(eventData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Meeting scheduled successfully",
      });

      resetForm();
      setOpen(false);
      onEventAdded();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to schedule meeting",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Meeting
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2" />
            Schedule Meeting
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Meeting Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Weekly team meeting"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Meeting agenda and objectives"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="event-type">Meeting Type</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="lecture">Lecture</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="presentation">Presentation</SelectItem>
                    <SelectItem value="review">Review Session</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="meeting-link">Meeting Link</Label>
                <Input
                  id="meeting-link"
                  type="url"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://zoom.us/j/... or https://teams.microsoft.com/..."
                />
              </div>

              <div>
                <Label htmlFor="location">Location (Optional)</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Conference Room A or Online"
                />
              </div>
            </div>

            {/* Right Column - Date, Time & Options */}
            <div className="space-y-4">
              <div>
                <Label>Date *</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="start-time">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Start Time
                  </Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recurring"
                    checked={isRecurring}
                    onCheckedChange={setIsRecurring}
                  />
                  <Label htmlFor="recurring">Recurring Meeting</Label>
                </div>

                {isRecurring && (
                  <Select value={recurringPattern} onValueChange={setRecurringPattern}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notifications"
                    checked={sendNotifications}
                    onCheckedChange={setSendNotifications}
                  />
                  <Label htmlFor="notifications">Send Email Notifications</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Participants Section */}
          <div className="border-t pt-4">
            <Label className="flex items-center mb-3">
              <Users className="h-4 w-4 mr-2" />
              Participants ({participants.length} available)
            </Label>
            <div className="max-h-32 overflow-y-auto space-y-2 border rounded p-3">
              {participants.length > 0 ? (
                participants.map((participant) => (
                  <div key={participant.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={participant.id}
                      checked={selectedParticipants.includes(participant.id)}
                      onCheckedChange={() => handleParticipantToggle(participant.id)}
                    />
                    <Label htmlFor={participant.id} className="text-sm">
                      {participant.first_name} {participant.last_name} ({participant.email})
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No participants enrolled in this course.</p>
              )}
            </div>
            <div className="mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedParticipants(participants.map(p => p.id))}
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={() => setSelectedParticipants([])}
              >
                Clear All
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Scheduling..." : "Schedule Meeting"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedCalendarEventDialog;
