import { useMemo } from "react";
import ReportsShell from "@/components/admin/wiki/reports/ReportsShell";
import { useWikiCategories } from "@/hooks/useWikiCategories";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GripVertical, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const AdminWikiTrainingPathsPage = () => {
  const { categories, isLoading } = useWikiCategories();
  const queryClient = useQueryClient();

  const ordered = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order),
    [categories]
  );

  const total = ordered.length;

  const handleReorder = async (id: string, newPos: number) => {
    // newPos is 1-indexed
    const current = ordered.findIndex((c) => c.id === id);
    if (current === -1) return;
    const target = Math.max(0, Math.min(total - 1, newPos - 1));
    if (target === current) return;

    const reordered = [...ordered];
    const [moved] = reordered.splice(current, 1);
    reordered.splice(target, 0, moved);

    try {
      await Promise.all(
        reordered.map((cat, idx) =>
          supabase
            .from("wiki_categories")
            .update({ sort_order: idx })
            .eq("id", cat.id)
        )
      );
      queryClient.invalidateQueries({ queryKey: ["wiki-categories"] });
      toast.success("Training path order updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to update order");
    }
  };

  return (
    <ReportsShell
      title="Training Paths"
      subtitle="Set the training order of all your content"
    >
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Arrange content in the order it should be completed — it'll appear in
          this order on employee to-do lists and groups pages.
        </p>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : ordered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No subjects yet.
          </div>
        ) : (
          <div className="space-y-2">
            {ordered.map((cat, idx) => (
              <div
                key={cat.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={String(idx + 1)}
                  onValueChange={(v) => handleReorder(cat.id, parseInt(v, 10))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {Array.from({ length: total }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 font-medium text-foreground">
                  {cat.title}
                </span>
                <Badge variant="secondary" className="capitalize">
                  {cat.category}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </ReportsShell>
  );
};

export default AdminWikiTrainingPathsPage;
