
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface Course {
  id: string;
  title: string;
  students_enrolled: number;
}

interface GlobalEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: Course[];
  onSubmit: (eventData: {
    title: string;
    description?: string;
    event_type: string;
    event_date: string;
    start_time?: string;
    end_time?: string;
    meeting_link?: string;
    course_ids: string[];
  }) => Promise<any>;
}

const GlobalEventDialog = ({ open, onOpenChange, courses, onSubmit }: GlobalEventDialogProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "general",
    event_date: "",
    start_time: "",
    end_time: "",
    meeting_link: "",
  });
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.event_date) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        course_ids: selectedCourses,
      });
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        event_type: "general",
        event_date: "",
        start_time: "",
        end_time: "",
        meeting_link: "",
      });
      setSelectedCourses([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCourseToggle = (courseId: string) => {
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const removeCourse = (courseId: string) => {
    setSelectedCourses(prev => prev.filter(id => id !== courseId));
  };

  const selectedCourseDetails = courses.filter(course => selectedCourses.includes(course.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Global Event</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="event_type">Event Type</Label>
              <Select value={formData.event_type} onValueChange={(value) => setFormData(prev => ({ ...prev, event_type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="lecture">Lecture</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="event_date">Date *</Label>
              <Input
                id="event_date"
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="meeting_link">Meeting Link</Label>
            <Input
              id="meeting_link"
              type="url"
              value={formData.meeting_link}
              onChange={(e) => setFormData(prev => ({ ...prev, meeting_link: e.target.value }))}
              placeholder="https://..."
            />
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            <Label>Select Courses</Label>
            
            {selectedCourseDetails.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedCourseDetails.map(course => (
                  <Badge key={course.id} variant="secondary" className="flex items-center gap-1">
                    {course.title}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeCourse(course.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
            
            <ScrollArea className="flex-1 border rounded-md p-3">
              <div className="space-y-2">
                {courses.map(course => (
                  <div key={course.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={course.id}
                      checked={selectedCourses.includes(course.id)}
                      onCheckedChange={() => handleCourseToggle(course.id)}
                    />
                    <Label htmlFor={course.id} className="flex-1 cursor-pointer">
                      {course.title} ({course.students_enrolled} students)
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.title || !formData.event_date}>
              {isSubmitting ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalEventDialog;
