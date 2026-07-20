import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Square, Diamond, Circle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ShapeNode, { type Shape } from "@/components/admin/wiki/flowchart/ShapeNode";
import WikiDocumentSidebar from "@/components/admin/wiki/WikiDocumentSidebar";
import { isPreviewAsStaffActive, usePreviewAsStaff, withPreviewAsStaffParam } from "@/hooks/usePreviewAsStaff";

interface ArticleRow {
  id: string;
  category_id: string;
  title: string;
  content: string | null;
  content_type: string;
}

const nodeTypes = { shape: ShapeNode };

const defaultGraph = (): { nodes: Node[]; edges: Edge[] } => ({ nodes: [], edges: [] });

const WikiFlowchartEditorInner = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<ArticleRow | null>(null);
  const [title, setTitle] = useState("");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const saveTimer = useRef<number | null>(null);
  const { enabled: previewAsStaff } = usePreviewAsStaff();

  const handleLabelChange = useCallback((id: string, label: string) => {
    if (isPreviewAsStaffActive()) return;
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n)),
    );
    setDirty(true);
  }, []);

  // Decorate nodes with handler whenever nodes change identity (not on every render)
  const decoratedNodes = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        type: "shape",
        data: { ...n.data, onLabelChange: handleLabelChange },
      })),
    [nodes, handleLabelChange],
  );

  useEffect(() => {
    let active = true;
    (async () => {
      if (!articleId) return;
      const { data, error } = await supabase
        .from("wiki_articles")
        .select("id, category_id, title, content, content_type")
        .eq("id", articleId)
        .single();
      if (!active) return;
      if (error || !data) {
        toast.error("Failed to load flowchart");
        navigate("/admin/wiki/content");
        return;
      }
      const row = data as ArticleRow;
      setArticle(row);
      setTitle(row.title);
      try {
        const parsed = row.content ? JSON.parse(row.content) : defaultGraph();
        setNodes(parsed.nodes || []);
        setEdges(parsed.edges || []);
      } catch {
        setNodes([]);
        setEdges([]);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [articleId, navigate]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    if (isPreviewAsStaffActive()) return;
    setNodes((nds) => applyNodeChanges(changes, nds));
    if (changes.some((c) => c.type !== "select" && c.type !== "dimensions")) {
      setDirty(true);
    }
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    if (isPreviewAsStaffActive()) return;
    setEdges((eds) => applyEdgeChanges(changes, eds));
    if (changes.some((c) => c.type !== "select")) setDirty(true);
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    if (isPreviewAsStaffActive()) return;
    setEdges((eds) =>
      addEdge(
        {
          ...connection,
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed },
        },
        eds,
      ),
    );
    setDirty(true);
  }, []);

  const addShape = (shape: Shape) => {
    if (isPreviewAsStaffActive()) return;
    const id = `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: "shape",
        position: { x: 100 + nds.length * 40, y: 100 + nds.length * 40 },
        data: { label: shape === "diamond" ? "Decision" : "New step", shape },
      },
    ]);
    setDirty(true);
  };

  const deleteSelected = () => {
    if (isPreviewAsStaffActive()) return;
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) => eds.filter((e) => !e.selected));
    setDirty(true);
  };

  const handleSave = useCallback(async () => {
    if (!article || previewAsStaff || isPreviewAsStaffActive()) return;
    setSaving(true);
    const trimmed = title.trim() || "Untitled flowchart";
    // Strip transient handler from data before persisting
    const cleanNodes = nodes.map(({ selected: _s, dragging: _d, ...n }) => ({
      ...n,
      data: { label: (n.data as any).label, shape: (n.data as any).shape },
    }));
    const cleanEdges = edges.map(({ selected: _s, ...e }) => e);
    const payload = JSON.stringify({ nodes: cleanNodes, edges: cleanEdges });
    const { error } = await supabase
      .from("wiki_articles")
      .update({ title: trimmed, content: payload })
      .eq("id", article.id);
    setSaving(false);
    if (error) {
      toast.error("Save failed: " + error.message);
      return;
    }
    setDirty(false);
  }, [article, title, nodes, edges, previewAsStaff]);

  // Autosave
  useEffect(() => {
    if (!dirty || loading || previewAsStaff || isPreviewAsStaffActive()) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => handleSave(), 1000);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [dirty, loading, handleSave, previewAsStaff]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const confirmNavigation = () => {
    if (!dirty || previewAsStaff || isPreviewAsStaffActive()) return true;
    return window.confirm("You have unsaved changes. Leave without saving?");
  };

  const handleBackToContent = () => {
    if (!confirmNavigation()) return;
    navigate(withPreviewAsStaffParam("/admin/wiki/content"), {
      state: { activeCategoryId: article?.category_id ?? null },
    });
  };

  return (
    <div className="flex h-screen bg-background">
      <WikiDocumentSidebar
        categoryId={article?.category_id}
        activeArticleId={article?.id}
        onBeforeNavigate={confirmNavigation}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <div className="border-b border-border bg-background">
          <div className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto w-full gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToContent}
                className="gap-2 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Content
              </Button>
              {previewAsStaff ? (
                <h1 className="text-lg font-semibold truncate px-2">{title}</h1>
              ) : (
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setDirty(true);
                  }}
                  className="text-lg font-semibold border-0 shadow-none focus-visible:ring-0 px-2"
                  placeholder="Flowchart title"
                />
              )}
            </div>
            {!previewAsStaff && <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground">
                {saving ? "Saving..." : dirty ? "Unsaved changes" : "Saved"}
              </span>
              <Button onClick={handleSave} disabled={saving || !dirty} size="sm">
                Save
              </Button>
            </div>}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {!previewAsStaff && <div className="w-48 border-r border-border bg-muted/30 p-3 space-y-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">
              Add shape
            </p>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => addShape("box")}>
              <Square className="h-4 w-4" /> Box
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => addShape("diamond")}>
              <Diamond className="h-4 w-4" /> Decision
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => addShape("oval")}>
              <Circle className="h-4 w-4" /> Oval
            </Button>
            <div className="pt-3 border-t border-border" />
            <Button variant="outline" className="w-full justify-start gap-2 text-destructive" onClick={deleteSelected}>
              <Trash2 className="h-4 w-4" /> Delete selected
            </Button>
            <p className="text-[11px] text-muted-foreground pt-3 leading-relaxed">
              Double-click a shape to rename. Drag from the right handle to the next shape to connect them.
            </p>
          </div>}

          <div className="flex-1">
            <ReactFlow
              nodes={decoratedNodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodesDraggable={!previewAsStaff}
              nodesConnectable={!previewAsStaff}
              elementsSelectable={!previewAsStaff}
              nodeTypes={nodeTypes}
              defaultEdgeOptions={{ type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } }}
              fitView
              fitViewOptions={{ padding: 0.3 }}
            >
              <Background />
              <Controls />
              <MiniMap pannable zoomable />
            </ReactFlow>
          </div>
        </div>
      </div>
    </div>
  );
};

const WikiFlowchartEditorPage = () => (
  <ReactFlowProvider>
    <WikiFlowchartEditorInner />
  </ReactFlowProvider>
);

export default WikiFlowchartEditorPage;
