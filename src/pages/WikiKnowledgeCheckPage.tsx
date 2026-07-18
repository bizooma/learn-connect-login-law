import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Plus, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { useWikiQuestions, WikiQuestion } from "@/hooks/useWikiQuestions";
import WikiDocumentSidebar from "@/components/admin/wiki/WikiDocumentSidebar";

const letter = (i: number) => String.fromCharCode(65 + i);

const QuestionCard = ({
  question,
  index,
  api,
}: {
  question: WikiQuestion;
  index: number;
  api: ReturnType<typeof useWikiQuestions>;
}) => {
  const [text, setText] = useState(question.question_text);
  useEffect(() => setText(question.question_text), [question.question_text]);

  return (
    <div className="rounded-lg border border-border bg-card p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-semibold">
          {index + 1}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (confirm("Delete this question?")) api.deleteQuestion.mutate(question.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          if (text !== question.question_text) {
            api.updateQuestion.mutate({ id: question.id, question_text: text });
          }
        }}
        placeholder="Enter your question..."
        className="text-base font-medium mb-2 border-0 shadow-none focus-visible:ring-0 resize-none p-0"
        rows={2}
      />
      <p className="text-sm text-muted-foreground mb-4">Select the correct answer.</p>

      <div className="space-y-2">
        {question.choices.map((choice, i) => (
          <ChoiceRow key={choice.id} choice={choice} letter={letter(i)} questionId={question.id} api={api} />
        ))}
      </div>

      <Button
        variant="link"
        className="px-0 mt-2"
        onClick={() =>
          api.addChoice.mutate({ question_id: question.id, sort_order: question.choices.length })
        }
      >
        Add choice
      </Button>
    </div>
  );
};

const ChoiceRow = ({
  choice,
  letter,
  questionId,
  api,
}: {
  choice: { id: string; choice_text: string; is_correct: boolean };
  letter: string;
  questionId: string;
  api: ReturnType<typeof useWikiQuestions>;
}) => {
  const [text, setText] = useState(choice.choice_text);
  useEffect(() => setText(choice.choice_text), [choice.choice_text]);

  return (
    <div
      className={`flex items-center gap-3 rounded-md border p-2 transition-colors ${
        choice.is_correct ? "border-primary bg-primary/5" : "border-border"
      }`}
    >
      <button
        onClick={() => api.setCorrectChoice.mutate({ question_id: questionId, choice_id: choice.id })}
        className={`flex items-center justify-center w-5 h-5 rounded-full border-2 shrink-0 ${
          choice.is_correct ? "border-primary bg-primary" : "border-muted-foreground"
        }`}
        title="Mark as correct"
      >
        {choice.is_correct && <Check className="h-3 w-3 text-primary-foreground" />}
      </button>
      <div className="flex items-center justify-center w-7 h-7 rounded border border-border text-xs font-semibold bg-background shrink-0">
        {letter}
      </div>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          if (text !== choice.choice_text) api.updateChoice.mutate({ id: choice.id, choice_text: text });
        }}
        placeholder="Choice text"
        className="border-0 shadow-none focus-visible:ring-0"
      />
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => api.deleteChoice.mutate(choice.id)}>
        <Trash2 className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  );
};

const WikiKnowledgeCheckPage = () => {
  const { articleId, categoryId } = useParams<{ articleId?: string; categoryId?: string }>();
  const navigate = useNavigate();
  const [articleTitle, setArticleTitle] = useState("");
  const [navCategoryId, setNavCategoryId] = useState<string | null>(categoryId ?? null);
  const [loading, setLoading] = useState(true);
  const api = useWikiQuestions(articleId, categoryId);

  useEffect(() => {
    (async () => {
      if (categoryId) {
        const { data, error } = await supabase
          .from("wiki_categories")
          .select("title")
          .eq("id", categoryId)
          .single();
        if (error) {
          toast.error("Failed to load");
          navigate(-1);
          return;
        }
        setArticleTitle(data.title);
        setNavCategoryId(categoryId);
        setLoading(false);
        return;
      }
      if (!articleId) return;
      const { data, error } = await supabase
        .from("wiki_articles")
        .select("title, category_id")
        .eq("id", articleId)
        .single();
      if (error) {
        toast.error("Failed to load");
        navigate(-1);
        return;
      }
      setArticleTitle(data.title);
      setNavCategoryId(data.category_id);
      setLoading(false);
    })();
  }, [articleId, categoryId, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <WikiDocumentSidebar
        categoryId={navCategoryId}
        activeArticleId={articleId}
        activeKnowledgeCheck
      />

      <div className="flex flex-col flex-1 min-w-0">
        <div className="border-b border-border bg-background sticky top-0 z-10">
          <div className="flex items-center justify-between px-6 py-3 max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-4 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/wiki/content", { state: { activeCategoryId: navCategoryId } })}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Content
              </Button>
              <div className="flex items-center gap-2 min-w-0">
                <span className="truncate text-sm text-muted-foreground">{articleTitle}</span>
                <span className="text-muted-foreground">/</span>
                <span className="font-semibold">Knowledge Check</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto w-full px-6 py-8">
            {api.questions.length === 0 && (
              <div className="text-center text-muted-foreground py-12 border border-dashed rounded-lg mb-6">
                No questions yet. Add your first question below.
              </div>
            )}

            {api.questions.map((q, i) => (
              <QuestionCard key={q.id} question={q} index={i} api={api} />
            ))}

            <Button
              onClick={() => api.createQuestion.mutate(articleId || "")}
              variant="outline"
              className="w-full gap-2 mt-4"
              disabled={api.createQuestion.isPending}
            >
              <Plus className="h-4 w-4" /> Add question
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WikiKnowledgeCheckPage;
