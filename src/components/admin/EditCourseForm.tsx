
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Info } from "lucide-react";
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
  const { form, isSubmitting, modules, setModules, onSubmit } = useEditCourseForm(
    course,
    open,
    () => {
      onCourseUpdated();
    }
  );

  if (!course) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Edit Course - Data Protected
          </DialogTitle>
          <DialogDescription>
            Update the course details and content. Your existing data is fully protected with our new incremental update system.
          </DialogDescription>
        </DialogHeader>

        <Alert className="bg-green-50 border-green-200">
          <Shield className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Data Protection Active:</strong> This form uses incremental updates that preserve all existing content. 
            Units, lessons, and modules not shown in the form will be kept safely in the database.
          </AlertDescription>
        </Alert>

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
                <Alert className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Safe Editing Mode:</strong> Only modify content you want to change. 
                    Existing content not shown here remains untouched and will be preserved.
                  </AlertDescription>
                </Alert>
                
                <CourseContentForm
                  modules={modules}
                  onModulesChange={setModules}
                />
              </TabsContent>

              <div className="flex justify-end items-center pt-6 border-t space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                  {isSubmitting ? "Updating Safely..." : "Update Course (Safe Mode)"}
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
