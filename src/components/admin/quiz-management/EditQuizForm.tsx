
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuestionManagement from "./QuestionManagement";
import { QuizWithDetails } from "./types";
import { supabase } from "@/integrations/supabase/client";

interface EditQuizFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quiz: QuizWithDetails | null;
  onQuizUpdated: () => void;
}

const EditQuizForm = ({ open, onOpenChange, quiz, onQuizUpdated }: EditQuizFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passingScore, setPassingScore] = useState(70);
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && quiz) {
      setTitle(quiz.title);
      setDescription(quiz.description || "");
      setPassingScore(quiz.passing_score);
      setTimeLimit(quiz.time_limit_minutes);
      setIsActive(quiz.is_active);
    }
  }, [open, quiz]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quiz || !title.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          passing_score: passingScore,
          time_limit_minutes: timeLimit,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', quiz.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Quiz updated successfully",
      });
      
      onQuizUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating quiz:', error);
      toast({
        title: "Error",
        description: "Failed to update quiz",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!quiz) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[90vw] sm:w-[800px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Quiz</SheetTitle>
          <SheetDescription>
            Update quiz details and manage questions
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6">
          <Tabs defaultValue="details" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Quiz Details</TabsTrigger>
              <TabsTrigger value="questions">Questions ({quiz.id ? 'Manage' : 'Save first'})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter quiz title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter quiz description (optional)"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="passingScore">Passing Score (%)</Label>
                    <Input
                      id="passingScore"
                      type="number"
                      min="1"
                      max="100"
                      value={passingScore}
                      onChange={(e) => setPassingScore(parseInt(e.target.value) || 70)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      min="1"
                      value={timeLimit || ""}
                      onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="No limit"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="isActive">Quiz is active</Label>
                </div>

                <SheetFooter className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Quiz"}
                  </Button>
                </SheetFooter>
              </form>
            </TabsContent>
            
            <TabsContent value="questions">
              {quiz.id ? (
                <QuestionManagement
                  quizId={quiz.id}
                  quizTitle={quiz.title}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Save the quiz first to manage questions</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default EditQuizForm;
