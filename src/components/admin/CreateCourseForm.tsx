
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CourseBasicInfoForm from "./course-form/CourseBasicInfoForm";
import CourseContentForm from "./course-form/CourseContentForm";
import DraftRecoveryDialog from "./course-form/DraftRecoveryDialog";
import SaveStatusIndicator from "./course-form/SaveStatusIndicator";
import { useCourseFormWithDrafts } from "./useCourseFormWithDrafts";
import { Save } from "lucide-react";

interface CreateCourseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCourseCreated: () => void;
}

const CreateCourseForm = ({ open, onOpenChange, onCourseCreated }: CreateCourseFormProps) => {
  const {
    form,
    isSubmitting,
    modules,
    setModules,
    onSubmit,
    saveStatus,
    lastSaved,
    showDraftDialog,
    setShowDraftDialog,
    drafts,
    handleLoadDraft,
    handleSaveDraft,
    deleteDraft,
    handleStartNew,
  } = useCourseFormWithDrafts(() => {
    onOpenChange(false);
    onCourseCreated();
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>
                  Fill in the course details and content to create a new course for students.
                </DialogDescription>
              </div>
              <SaveStatusIndicator status={saveStatus} lastSaved={lastSaved} />
            </div>
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
                    modules={modules}
                    onModulesChange={setModules}
                  />
                </TabsContent>

                <div className="flex justify-between items-center pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveDraft}
                    className="flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Draft</span>
                  </Button>
                  
                  <div className="flex space-x-2">
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
                </div>
              </form>
            </Form>
          </Tabs>
        </DialogContent>
      </Dialog>

      <DraftRecoveryDialog
        open={showDraftDialog}
        onOpenChange={setShowDraftDialog}
        drafts={drafts}
        onLoadDraft={handleLoadDraft}
        onDeleteDraft={deleteDraft}
        onStartNew={handleStartNew}
      />
    </>
  );
};

export default CreateCourseForm;
