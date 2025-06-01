
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CourseBasicInfoForm from "./course-form/CourseBasicInfoForm";
import CourseContentForm from "./course-form/CourseContentForm";
import { useEditCourseForm } from "./course-form/useEditCourseForm";
import { Tables } from "@/integrations/supabase/types";
import { Plus, FileText, Package } from "lucide-react";

type Course = Tables<'courses'>;

interface EditCourseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
  onCourseUpdated: () => void;
}

const EditCourseForm = ({ open, onOpenChange, course, onCourseUpdated }: EditCourseFormProps) => {
  const { form, isSubmitting, lessons, setLessons, onSubmit } = useEditCourseForm(
    course,
    open,
    () => {
      // Don't auto-close the modal anymore, just trigger the callback
      onCourseUpdated();
    }
  );

  if (!course) return null;

  const handleAddModule = () => {
    const newModule = {
      title: `Module ${lessons.length + 1}`,
      description: '',
      image_url: '',
      sort_order: lessons.length,
      units: []
    };
    
    setLessons([...lessons, newModule]);
  };

  const handleAddLesson = () => {
    const newLesson = {
      title: `Lesson ${lessons.length + 1}`,
      description: '',
      image_url: '',
      sort_order: lessons.length,
      units: []
    };
    
    setLessons([...lessons, newLesson]);
  };

  const handleAddUnit = () => {
    if (lessons.length === 0) {
      handleAddLesson();
      setTimeout(() => {
        const newUnit = {
          title: `Unit 1`,
          description: '',
          content: '',
          video_url: '',
          video_type: 'youtube' as const,
          duration_minutes: 0,
          sort_order: 0
        };
        
        setLessons(prev => {
          const updated = [...prev];
          if (updated[0]) {
            updated[0].units = [...updated[0].units, newUnit];
          }
          return updated;
        });
      }, 100);
    } else {
      const newUnit = {
        title: `Unit ${lessons[0].units.length + 1}`,
        description: '',
        content: '',
        video_url: '',
        video_type: 'youtube' as const,
        duration_minutes: 0,
        sort_order: lessons[0].units.length
      };
      
      setLessons(prev => {
        const updated = [...prev];
        updated[0].units = [...updated[0].units, newUnit];
        return updated;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
          <DialogDescription>
            Update the course details and content. Changes will be saved when you click Update Course.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="content">Course Content</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <TabsContent value="basic">
                <CourseBasicInfoForm control={form.control} />
              </TabsContent>

              <TabsContent value="content">
                <CourseContentForm
                  lessons={lessons}
                  onLessonsChange={setLessons}
                />
              </TabsContent>

              <div className="flex justify-between items-center pt-6 border-t">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleAddModule}
                    variant="outline"
                    size="sm"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Add Module
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddLesson}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lesson
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddUnit}
                    variant="outline"
                    size="sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Add Unit
                  </Button>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Close
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Updating..." : "Update Course"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EditCourseForm;
