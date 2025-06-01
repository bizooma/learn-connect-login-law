
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuestionManagement from "./QuestionManagement";
import { Tables } from "@/integrations/supabase/types";
import { UnitWithCourse, QuizFormData } from "./types";

type Quiz = Tables<'quizzes'>;

interface EditQuizFormProps {
  open: boolean;
  onOpenChange: () => void;
  quiz: Quiz;
  onQuizUpdated: () => void;
}

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Quiz title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  unit_id: z.string().uuid({ message: "Please select a valid unit." }),
  passing_score: z.number().min(0).max(100),
  time_limit_minutes: z.number().optional(),
  is_active: z.boolean().default(true),
});

const EditQuizForm = ({ open, onOpenChange, quiz, onQuizUpdated }: EditQuizFormProps) => {
  const { toast } = useToast();
  const [showQuestionManagement, setShowQuestionManagement] = useState(false);

  const form = useForm<QuizFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: quiz.title,
      description: quiz.description || "",
      unit_id: quiz.unit_id,
      passing_score: quiz.passing_score,
      time_limit_minutes: quiz.time_limit_minutes,
      is_active: quiz.is_active,
    },
  });

  const { data: units, isLoading: unitsLoading } = useQuery({
    queryKey: ['units-for-quiz-edit'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select(`
          *,
          lesson:lessons (
            *,
            course:courses (*)
          )
        `)
        .order('title');

      if (error) throw error;
      return data as UnitWithCourse[];
    }
  });

  useEffect(() => {
    // Update form default values when quiz prop changes
    form.reset({
      title: quiz.title,
      description: quiz.description || "",
      unit_id: quiz.unit_id,
      passing_score: quiz.passing_score,
      time_limit_minutes: quiz.time_limit_minutes,
      is_active: quiz.is_active,
    });
  }, [quiz, form]);

  const onSubmit = async (values: QuizFormData) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .update(values)
        .eq('id', quiz.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quiz updated successfully",
      });
      onQuizUpdated();
      onOpenChange();
    } catch (error) {
      console.error("Error updating quiz:", error);
      toast({
        title: "Error",
        description: "Failed to update quiz",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Quiz</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <TabsContent value="details">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quiz Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Quiz title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Quiz description"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {units?.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="passing_score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passing Score (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Passing score"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="time_limit_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Limit (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Time limit"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Activate or deactivate the quiz.
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="questions">
                <QuestionManagement quizId={quiz.id} quizTitle={quiz.title} />
              </TabsContent>

              <div className="flex justify-between">
                <Button type="submit">Update Quiz</Button>
                <Button type="button" variant="outline" onClick={onOpenChange}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EditQuizForm;
