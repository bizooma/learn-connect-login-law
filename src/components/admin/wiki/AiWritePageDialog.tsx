import { useState } from "react";
import DOMPurify from "dompurify";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AiWritePageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageTitle: string;
  subjectName?: string;
  currentContent: string;
  onInsert: (newContent: string) => void;
}

const SANITIZE_OPTS = {
  ALLOWED_TAGS: [
    "p", "br", "strong", "em", "u", "s", "a", "blockquote", "code", "pre",
    "h2", "h3", "h4", "ul", "ol", "li", "hr", "table", "thead", "tbody",
    "tr", "th", "td",
  ],
  ALLOWED_ATTR: ["href", "target", "rel"],
};

const AiWritePageDialog = ({
  open,
  onOpenChange,
  pageTitle,
  subjectName,
  currentContent,
  onInsert,
}: AiWritePageDialogProps) => {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [mode, setMode] = useState<"replace" | "append">("replace");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string>("");

  const reset = () => {
    setPrompt("");
    setPreview("");
    setLoading(false);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Enter a prompt");
      return;
    }
    setLoading(true);
    setPreview("");
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-wiki-page-content",
        {
          body: {
            pageTitle,
            subjectName,
            prompt: prompt.trim(),
            tone,
            length,
          },
        },
      );
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const rawHtml = (data as any)?.html || "";
      const clean = DOMPurify.sanitize(rawHtml, SANITIZE_OPTS);
      if (!clean.trim()) throw new Error("AI returned empty content");
      setPreview(clean);
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = () => {
    if (!preview) return;
    const next =
      mode === "append" && currentContent
        ? `${currentContent}\n${preview}`
        : preview;
    onInsert(next);
    toast.success("AI content inserted");
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Write with AI
          </DialogTitle>
          <DialogDescription>
            Describe what this page should cover and AI will draft it for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-xs text-muted-foreground bg-muted/50 rounded px-3 py-2">
            <div><strong>Page:</strong> {pageTitle || "(untitled)"}</div>
            {subjectName && <div><strong>Subject:</strong> {subjectName}</div>}
          </div>

          <div>
            <Label htmlFor="ai-prompt">What should this page cover?</Label>
            <Textarea
              id="ai-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Explain the intake process for new immigration clients, including required documents, initial consultation steps, and follow-up timeline."
              className="min-h-[120px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="concise">Concise</SelectItem>
                  <SelectItem value="instructional">Instructional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Length</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">When inserting</Label>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as any)} className="flex gap-6">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="replace" id="mode-replace" />
                <Label htmlFor="mode-replace" className="font-normal cursor-pointer">Replace current content</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="append" id="mode-append" />
                <Label htmlFor="mode-append" className="font-normal cursor-pointer">Append to end</Label>
              </div>
            </RadioGroup>
          </div>

          {preview && (
            <div>
              <Label>Preview</Label>
              <div
                className="prose prose-sm max-w-none border border-border rounded-md p-4 max-h-[300px] overflow-y-auto bg-background"
                dangerouslySetInnerHTML={{ __html: preview }}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="outline"
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {preview ? "Regenerate" : "Generate"}
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleInsert} disabled={!preview || loading}>Insert into page</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AiWritePageDialog;
