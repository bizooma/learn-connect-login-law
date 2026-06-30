import { useMemo, useState } from "react";
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
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Cat = {
  id: string;
  title: string;
  category: string;
  sort_order: number;
};

const SortableRow = ({
  cat,
  idx,
  total,
  onSelect,
}: {
  cat: Cat;
  idx: number;
  total: number;
  onSelect: (id: string, pos: number) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    boxShadow: isDragging ? "0 8px 24px rgba(0,0,0,0.15)" : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing touch-none p-1 -m-1 text-muted-foreground hover:text-foreground"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Select
        value={String(idx + 1)}
        onValueChange={(v) => onSelect(cat.id, parseInt(v, 10))}
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
      <span className="flex-1 font-medium text-foreground">{cat.title}</span>
      <Badge variant="secondary" className="capitalize">
        {cat.category}
      </Badge>
    </div>
  );
};

const AdminWikiTrainingPathsPage = () => {
  const { categories, isLoading } = useWikiCategories();
  const queryClient = useQueryClient();
  const [localOrder, setLocalOrder] = useState<Cat[] | null>(null);

  const ordered = useMemo(
    () =>
      localOrder ??
      [...categories].sort((a, b) => a.sort_order - b.sort_order),
    [categories, localOrder]
  );

  const total = ordered.length;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const persistOrder = async (reordered: Cat[]) => {
    setLocalOrder(reordered);
    try {
      await Promise.all(
        reordered.map((cat, idx) =>
          supabase
            .from("wiki_categories")
            .update({ sort_order: idx })
            .eq("id", cat.id)
        )
      );
      await queryClient.invalidateQueries({ queryKey: ["wiki-categories"] });
      toast.success("Training path order updated");
      setLocalOrder(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to update order");
      setLocalOrder(null);
    }
  };

  const handleReorder = (id: string, newPos: number) => {
    const current = ordered.findIndex((c) => c.id === id);
    if (current === -1) return;
    const target = Math.max(0, Math.min(total - 1, newPos - 1));
    if (target === current) return;
    const reordered = arrayMove(ordered, current, target);
    persistOrder(reordered);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = ordered.findIndex((c) => c.id === active.id);
    const to = ordered.findIndex((c) => c.id === over.id);
    if (from === -1 || to === -1) return;
    const reordered = arrayMove(ordered, from, to);
    persistOrder(reordered);
  };

  return (
    <ReportsShell
      title="Training Paths"
      subtitle="Set the training order of all your content"
    >
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Arrange content in the order it should be completed — it'll appear in
          this order on employee to-do lists and groups pages. Drag the handle
          or use the dropdown to reorder.
        </p>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : ordered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No subjects yet.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={ordered.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {ordered.map((cat, idx) => (
                  <SortableRow
                    key={cat.id}
                    cat={cat}
                    idx={idx}
                    total={total}
                    onSelect={handleReorder}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </ReportsShell>
  );
};

export default AdminWikiTrainingPathsPage;
