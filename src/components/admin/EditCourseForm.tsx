
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CourseBasicInfoForm from "./course-form/CourseBasicInfoForm";
import CourseContentForm from "./course-form/CourseContentForm";
import { useEditCourseForm } from "./course-form/useEditCourseForm";
import { Tables } from "@/integrations/supabase/types";

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

              <div className="flex justify-between pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Course"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EditCourseForm;
