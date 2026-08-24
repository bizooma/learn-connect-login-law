import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const letter = (i: number) => String.fromCharCode(65 + i);

interface QuizChoice {
  id: string;
  choice_text: string;
}

interface QuizQuestion {
  question_id: string;
  question_text: string;
  question_type: string;
  sort_order: number;
  choices: QuizChoice[];
}

interface QuizResult {
  attempt_id: string;
  score_percent: number;
  questions_total: number;
  questions_correct: number;
  pass_threshold: number;
  passed: boolean;
  missed_question_ids?: string[];
}

const WikiQuizRunner = ({ categoryId }: { categoryId: string }) => {
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("get_wiki_quiz", {
        _category_id: categoryId,
      });
      if (error) {
        console.error("get_wiki_quiz failed", error);
        setLoadFailed(true);
        return;
      }
      const rows = (data ?? []).map((r: any) => ({
        ...r,
        choices: Array.isArray(r.choices) ? (r.choices as QuizChoice[]) : [],
      })) as QuizQuestion[];
      rows.sort((a, b) => a.sort_order - b.sort_order);
      setQuestions(rows);
    })();
  }, [categoryId]);

  const toggleSingle = (questionId: string, choiceId: string) => {
    setSelections((prev) => ({ ...prev, [questionId]: [choiceId] }));
  };

  const toggleMulti = (questionId: string, choiceId: string) => {
    setSelections((prev) => {
      const current = prev[questionId] ?? [];
      const next = current.includes(choiceId)
        ? current.filter((c) => c !== choiceId)
        : [...current, choiceId];
      return { ...prev, [questionId]: next };
    });
  };

  const handleSubmit = async () => {
    if (!questions || submitting) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("submit_wiki_quiz", {
        _category_id: categoryId,
        _answers: questions.map((q) => ({
          question_id: q.question_id,
          selected_choice_ids: selections[q.question_id] ?? [],
        })) as any,
      });
      if (error) throw error;
      setResult(data as unknown as QuizResult);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("submit_wiki_quiz failed", err);
      toast.error(err.message || "Could not submit your answers. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setSelections({});
    setResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loadFailed) {
    return (
      <div className="text-center text-muted-foreground py-12 border border-dashed rounded-lg">
        Something went wrong loading this knowledge check. Please try again.
      </div>
    );
  }

  if (questions === null) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12 border border-dashed rounded-lg">
        No knowledge check is available for this subject yet.
      </div>
    );
  }

  if (result) {
    const missedSet = new Set(result.missed_question_ids ?? []);
    // Map missed IDs against the questions already loaded — question text only,
    // no correct answers ever reach the client.
    const missedQuestions = questions
      .map((q, i) => ({ ...q, number: i + 1 }))
      .filter((q) => missedSet.has(q.question_id));
    const missedCount = result.questions_total - result.questions_correct;
    return (
      <div>
        <div className="rounded-lg border border-border bg-card p-8 mb-6 text-center">
          <div className="flex justify-center mb-4">
            {result.passed ? (
              <CheckCircle2 className="h-14 w-14 text-green-600" />
            ) : (
              <XCircle className="h-14 w-14 text-destructive" />
            )}
          </div>
          <h2
            className="text-2xl font-bold mb-1"
            style={{ color: result.passed ? undefined : "#213C82" }}
          >
            {result.passed ? "You passed!" : "Not quite yet"}
          </h2>
          <p className="text-4xl font-bold my-4" style={{ color: "#213C82" }}>
            {Math.round(result.score_percent)}%
          </p>
          <p className="text-sm text-muted-foreground">
            {result.questions_correct} of {result.questions_total} correct ·{" "}
            {result.pass_threshold}% needed to pass
          </p>
          <Button onClick={handleRetake} className="mt-6 gap-2">
            <RotateCcw className="h-4 w-4" /> Retake
          </Button>
        </div>

        {missedCount > 0 && wrongQuestions.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-semibold mb-3">
              Questions to review ({missedCount})
            </h3>
            <ul className="space-y-2">
              {wrongQuestions.map((q) => (
                <li
                  key={q.question_id}
                  className="text-sm text-muted-foreground border-b border-border last:border-0 pb-2"
                >
                  {q.question_text}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {questions.map((q, i) => {
        const isMulti = q.question_type === "multi_select";
        const selected = selections[q.question_id] ?? [];
        return (
          <div
            key={q.question_id}
            className="rounded-lg border border-border bg-card p-6 mb-4"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-semibold mb-4">
              {i + 1}
            </div>
            <p className="text-base font-medium mb-2">{q.question_text}</p>
            <p className="text-sm text-muted-foreground mb-4">
              {isMulti ? "Select all that apply." : "Select one answer."}
            </p>
            <div className="space-y-2">
              {q.choices.map((choice, ci) => {
                const checked = selected.includes(choice.id);
                return (
                  <label
                    key={choice.id}
                    className={`flex items-center gap-3 rounded-md border p-2 cursor-pointer transition-colors ${
                      checked
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    {isMulti ? (
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleMulti(q.question_id, choice.id)}
                      />
                    ) : (
                      <span
                        role="radio"
                        aria-checked={checked}
                        onClick={() => toggleSingle(q.question_id, choice.id)}
                        className={`flex items-center justify-center w-5 h-5 rounded-full border-2 shrink-0 ${
                          checked ? "border-primary bg-primary" : "border-muted-foreground"
                        }`}
                      >
                        {checked && (
                          <span className="w-2 h-2 rounded-full bg-primary-foreground" />
                        )}
                      </span>
                    )}
                    <span className="flex items-center justify-center w-7 h-7 rounded border border-border text-xs font-semibold bg-background shrink-0">
                      {letter(ci)}
                    </span>
                    <span className="text-sm">{choice.choice_text}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full mt-4"
        size="lg"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...
          </>
        ) : (
          "Submit answers"
        )}
      </Button>
    </div>
  );
};

export default WikiQuizRunner;
