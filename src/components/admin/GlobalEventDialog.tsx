
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Search } from "lucide-react";

interface Course {
  id: string;
  title: string;
  actual_enrollment_count: number;
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
    target_roles: string[];
    target_email_domains: string[];
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
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedEmailDomains, setSelectedEmailDomains] = useState<string[]>([]);
  const [targetingMode, setTargetingMode] = useState<"courses" | "roles" | "email_domains">("courses");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const availableRoles = [
    { id: "owner", name: "Law Firm Owners", description: "All law firm owners" },
    { id: "student", name: "Students", description: "All students" },
    { id: "admin", name: "Administrators", description: "All administrators" },
    { id: "team_leader", name: "Team Leaders", description: "All team leaders" },
  ];

  const availableEmailDomains = [
    { id: "newfrontier.us", name: "New Frontier Users", description: "All users with @newfrontier.us email addresses" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.event_date) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        course_ids: targetingMode === "courses" ? selectedCourses : [],
        target_roles: targetingMode === "roles" ? selectedRoles : [],
        target_email_domains: targetingMode === "email_domains" ? selectedEmailDomains : [],
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
      setSelectedRoles([]);
      setSelectedEmailDomains([]);
      setTargetingMode("courses");
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

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const removeRole = (roleId: string) => {
    setSelectedRoles(prev => prev.filter(id => id !== roleId));
  };

  const handleEmailDomainToggle = (domainId: string) => {
    setSelectedEmailDomains(prev =>
      prev.includes(domainId)
        ? prev.filter(id => id !== domainId)
        : [...prev, domainId]
    );
  };

  const removeEmailDomain = (domainId: string) => {
    setSelectedEmailDomains(prev => prev.filter(id => id !== domainId));
  };

  const selectedCourseDetails = courses.filter(course => selectedCourses.includes(course.id));
  const selectedRoleDetails = availableRoles.filter(role => selectedRoles.includes(role.id));
  const selectedEmailDomainDetails = availableEmailDomains.filter(domain => selectedEmailDomains.includes(domain.id));

  // Filter courses based on search term
  const filteredCourses = useMemo(() => {
    if (!searchTerm) return courses;
    return courses.filter(course => 
      course.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [courses, searchTerm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] max-h-[800px] flex flex-col p-0">
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle>Create Global Event</DialogTitle>
          </DialogHeader>
        </div>
        
        <div className="flex-1 overflow-hidden px-6">
          <form onSubmit={handleSubmit} className="h-full flex flex-col gap-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

            <div className="flex-1 flex flex-col space-y-3 min-h-0">
              <Label>Event Targeting</Label>
              
              <Tabs value={targetingMode} onValueChange={(value) => setTargetingMode(value as "courses" | "roles" | "email_domains")} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="courses">Target Courses</TabsTrigger>
                  <TabsTrigger value="roles">Target User Roles</TabsTrigger>
                  <TabsTrigger value="email_domains">Target Email Domains</TabsTrigger>
                </TabsList>
                
                <TabsContent value="courses" className="flex-1 flex flex-col space-y-3 mt-3">
                  <div className="flex items-center justify-between">
                    <Label>Select Courses</Label>
                    {selectedCourses.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''} selected
                      </Badge>
                    )}
                  </div>
                  
                  {selectedCourseDetails.length > 0 && (
                    <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                      {selectedCourseDetails.map(course => (
                        <Badge key={course.id} variant="secondary" className="flex items-center gap-1 text-xs">
                          <span className="truncate max-w-32">{course.title}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground ml-1"
                            onClick={() => removeCourse(course.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <ScrollArea className="flex-1 border rounded-md min-h-[200px] max-h-[400px]">
                    <div className="p-3 space-y-3">
                      {filteredCourses.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          {searchTerm ? 'No courses found matching your search.' : 'No courses available.'}
                        </div>
                      ) : (
                        filteredCourses.map(course => (
                          <div key={course.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                            <Checkbox
                              id={course.id}
                              checked={selectedCourses.includes(course.id)}
                              onCheckedChange={() => handleCourseToggle(course.id)}
                              className="min-w-[20px]"
                            />
                            <Label htmlFor={course.id} className="flex-1 cursor-pointer leading-5">
                              <div className="font-medium">{course.title}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {course.actual_enrollment_count} student{course.actual_enrollment_count !== 1 ? 's' : ''}
                              </div>
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="roles" className="flex-1 flex flex-col space-y-3 mt-3">
                  <div className="flex items-center justify-between">
                    <Label>Select User Roles</Label>
                    {selectedRoles.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {selectedRoles.length} role{selectedRoles.length !== 1 ? 's' : ''} selected
                      </Badge>
                    )}
                  </div>
                  
                  {selectedRoleDetails.length > 0 && (
                    <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                      {selectedRoleDetails.map(role => (
                        <Badge key={role.id} variant="secondary" className="flex items-center gap-1 text-xs">
                          <span className="truncate max-w-32">{role.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground ml-1"
                            onClick={() => removeRole(role.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <ScrollArea className="flex-1 border rounded-md min-h-[200px] max-h-[400px]">
                    <div className="p-3 space-y-3">
                      {availableRoles.map(role => (
                        <div key={role.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                          <Checkbox
                            id={role.id}
                            checked={selectedRoles.includes(role.id)}
                            onCheckedChange={() => handleRoleToggle(role.id)}
                            className="min-w-[20px]"
                          />
                          <Label htmlFor={role.id} className="flex-1 cursor-pointer leading-5">
                            <div className="font-medium">{role.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {role.description}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="email_domains" className="flex-1 flex flex-col space-y-3 mt-3">
                  <div className="flex items-center justify-between">
                    <Label>Select Email Domains</Label>
                    {selectedEmailDomains.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {selectedEmailDomains.length} domain{selectedEmailDomains.length !== 1 ? 's' : ''} selected
                      </Badge>
                    )}
                  </div>
                  
                  {selectedEmailDomainDetails.length > 0 && (
                    <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                      {selectedEmailDomainDetails.map(domain => (
                        <Badge key={domain.id} variant="secondary" className="flex items-center gap-1 text-xs">
                          <span className="truncate max-w-32">{domain.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground ml-1"
                            onClick={() => removeEmailDomain(domain.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <ScrollArea className="flex-1 border rounded-md min-h-[200px] max-h-[400px]">
                    <div className="p-3 space-y-3">
                      {availableEmailDomains.map(domain => (
                        <div key={domain.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                          <Checkbox
                            id={domain.id}
                            checked={selectedEmailDomains.includes(domain.id)}
                            onCheckedChange={() => handleEmailDomainToggle(domain.id)}
                            className="min-w-[20px]"
                          />
                          <Label htmlFor={domain.id} className="flex-1 cursor-pointer leading-5">
                            <div className="font-medium">{domain.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {domain.description}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>

          </form>
        </div>
        
        <div className="border-t bg-muted/20 px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="min-w-[100px]">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.title || !formData.event_date || 
                (targetingMode === "courses" && selectedCourses.length === 0) || 
                (targetingMode === "roles" && selectedRoles.length === 0) ||
                (targetingMode === "email_domains" && selectedEmailDomains.length === 0)}
              onClick={handleSubmit}
              className="min-w-[100px]"
            >
              {isSubmitting ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalEventDialog;
