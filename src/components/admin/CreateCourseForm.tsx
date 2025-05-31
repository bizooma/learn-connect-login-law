
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CourseBasicInfoForm from "./course-form/CourseBasicInfoForm";
import CourseContentForm from "./course-form/CourseContentForm";
import { useCourseForm } from "./course-form/useCourseForm";

interface CreateCourseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCourseCreated: () => void;
}

const CreateCourseForm = ({ open, onOpenChange, onCourseCreated }: CreateCourseFormProps) => {
  const { form, isSubmitting, sections, setSections, onSubmit } = useCourseForm(() => {
    onOpenChange(false);
    onCourseCreated();
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Course</DialogTitle>
          <DialogDescription>
            Fill in the course details and content to create a new course for students.
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
                  sections={sections}
                  onSectionsChange={setSections}
                />
              </TabsContent>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Course"}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCourseForm;
