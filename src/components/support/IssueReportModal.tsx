import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Course {
  id: string;
  title: string;
}

interface Unit {
  id: string;
  title: string;
}

interface IssueReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const IssueReportModal = ({ open, onOpenChange }: IssueReportModalProps) => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    courseId: "",
    unitId: "",
    priority: "medium",
    description: "",
  });

  // Pre-populate user data when modal opens
  useEffect(() => {
    if (open && user) {
      const fetchUserProfile = async () => {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', user.id)
            .single();

          if (profile) {
            setFormData(prev => ({
              ...prev,
              name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
              email: profile.email || user.email || '',
            }));
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          setFormData(prev => ({
            ...prev,
            name: user.user_metadata?.first_name || 'User',
            email: user.email || '',
          }));
        }
      };

      fetchUserProfile();
      fetchUserCourses();
    }
  }, [open, user]);

  // Fetch user's assigned courses
  const fetchUserCourses = async () => {
    if (!user) {
      console.log('No user found');
      return;
    }

    console.log('Fetching courses for user:', user.id);

    try {
      // First, get assignments with course IDs
      const { data: assignments, error: assignmentsError } = await supabase
        .from('course_assignments')
        .select('course_id')
        .eq('user_id', user.id);

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
        return;
      }

      console.log('Assignments found:', assignments);

      if (!assignments || assignments.length === 0) {
        console.log('No course assignments found for user');
        setCourses([]);
        return;
      }

      // Get unique course IDs
      const courseIds = [...new Set(assignments.map(a => a.course_id))];
      console.log('Course IDs:', courseIds);

      // Fetch course details
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .in('id', courseIds);

      if (coursesError) {
        console.error('Error fetching courses:', coursesError);
        return;
      }

      console.log('Courses data:', coursesData);

      if (coursesData) {
        setCourses(coursesData);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  // Fetch units for selected course
  useEffect(() => {
    if (formData.courseId) {
      fetchCourseUnits(formData.courseId);
    } else {
      setUnits([]);
      setFormData(prev => ({ ...prev, unitId: "" }));
    }
  }, [formData.courseId]);

  const fetchCourseUnits = async (courseId: string) => {
    try {
      const { data: lessons } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          units (
            id,
            title
          )
        `)
        .eq('course_id', courseId);

      if (lessons) {
        const unitList: Unit[] = [];
        lessons.forEach(lesson => {
          if (lesson.units) {
            lesson.units.forEach((unit: any) => {
              unitList.push({
                id: unit.id,
                title: unit.title,
              });
            });
          }
        });
        setUnits(unitList);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔧 Starting issue report submission...', { user: user?.id, role });
    
    if (!formData.name || !formData.email || !formData.description) {
      console.log('❌ Validation failed - missing required fields', formData);
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get course and unit names for better context
      const selectedCourse = courses.find(c => c.id === formData.courseId);
      const selectedUnit = units.find(u => u.id === formData.unitId);
      
      console.log('📚 Course context:', { 
        selectedCourse: selectedCourse?.title, 
        selectedUnit: selectedUnit?.title,
        totalCourses: courses.length,
        totalUnits: units.length 
      });
      
      let contextDescription = formData.description;
      if (selectedCourse || selectedUnit) {
        contextDescription += '\n\nContext:';
        if (selectedCourse) {
          contextDescription += `\n- Course: ${selectedCourse.title}`;
        }
        if (selectedUnit) {
          contextDescription += `\n- Unit: ${selectedUnit.title}`;
        }
      }

      const requestBody = {
        userId: user?.id,
        userName: formData.name,
        userEmail: formData.email,
        userRole: role || 'student',
        subject: `Issue Report: ${selectedCourse?.title || 'General Issue'}`,
        description: contextDescription,
        category: 'issue_report',
        priority: formData.priority,
      };

      console.log('📤 Sending support ticket request:', requestBody);

      const { data, error } = await supabase.functions.invoke('submit-support-ticket', {
        body: requestBody,
      });

      console.log('📥 Support ticket response:', { data, error });

      if (error) throw error;

      toast({
        title: "Issue Reported Successfully",
        description: "Your issue has been submitted. Our support team will review it shortly.",
      });

      // Reset form and close modal
      setFormData({
        name: "",
        email: "",
        courseId: "",
        unitId: "",
        priority: "medium",
        description: "",
      });
      onOpenChange(false);

    } catch (error) {
      console.error('Error submitting issue report:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your issue report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="course">Course (Optional)</Label>
              <Select
                value={formData.courseId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, courseId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="unit">Unit (Optional)</Label>
              <Select
                value={formData.unitId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, unitId: value }))}
                disabled={!formData.courseId || units.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Issue Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Please describe the issue you're experiencing..."
              rows={4}
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Issue'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default IssueReportModal;