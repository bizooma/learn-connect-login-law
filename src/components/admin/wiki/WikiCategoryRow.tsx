import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronDown, MoreVertical, Pencil, Trash2, Eye, EyeOff, Copy, Link2, Printer, Archive, Tag, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WikiCategory, useWikiCategories, WikiSubjectCategory } from "@/hooks/useWikiCategories";
import { WikiArticle } from "@/hooks/useWikiArticles";
import WikiArticleList from "./WikiArticleList";
import { getSubjectCategoryMeta } from "./subjectCategoryMeta";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useWikiColumns } from "./WikiColumnsContext";
import { printSubjectPdf } from "@/lib/printSubjectPdf";
import OwnerPicker from "./OwnerPicker";


interface WikiCategoryRowProps {
  category: WikiCategory;
  onEdit: (category: WikiCategory) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (category: WikiCategory) => void;
  onEditArticle: (article: WikiArticle) => void;
  searchQuery?: string;
  defaultExpanded?: boolean;
}

const WikiCategoryRow = ({ category, onEdit, onDelete, onTogglePublish, onEditArticle, searchQuery, defaultExpanded }: WikiCategoryRowProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded || false);
  const count = category.article_count || 0;
  const meta = getSubjectCategoryMeta(category.category);
  const CategoryIcon = meta.Icon;
  const { updateCategory } = useWikiCategories();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { gridTemplate } = useWikiColumns();

  const handleRename = async () => {
    const newTitle = window.prompt("Rename subject", category.title);
    if (!newTitle || newTitle.trim() === "" || newTitle === category.title) return;
    updateCategory.mutate({ id: category.id, title: newTitle.trim() });
  };

  const handleDuplicate = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");
      const { data: maxRow } = await supabase
        .from("wiki_categories")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1);
      const nextOrder = maxRow && maxRow.length > 0 ? (maxRow[0] as any).sort_order + 1 : 0;
      const { error } = await supabase.from("wiki_categories").insert({
        title: `${category.title} (Copy)`,
        description: category.description,
        icon_name: category.icon_name,
        category: category.category,
        sort_order: nextOrder,
        is_published: false,
        created_by: userData.user.id,
      } as any);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["wiki-categories"] });
      toast.success("Subject duplicated");
    } catch (e: any) {
      toast.error("Failed to duplicate: " + e.message);
    }
  };

  const handleChangeCategory = (newCat: WikiSubjectCategory) => {
    if (newCat === category.category) return;
    updateCategory.mutate({ id: category.id, category: newCat });
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/admin/wiki/content?subject=${category.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handlePrint = () => {
    printSubjectPdf(category.id);
  };

  const handleArchive = () => {
    updateCategory.mutate({ id: category.id, is_published: false });
    toast.success("Subject archived");
  };


  return (
    <div className="border-b border-border">
      <div
        className="grid items-center gap-4 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
        style={{ gridTemplateColumns: gridTemplate }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <CategoryIcon className={`h-5 w-5 shrink-0 ${meta.iconColor}`} />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate("/admin/wiki/content", { state: { activeCategoryId: category.id } });
            }}
            className="font-medium text-foreground truncate text-left hover:text-primary hover:underline"
          >
            {category.title}
          </button>
        </div>
        <span className="text-xs text-muted-foreground">
          {count} {count === 1 ? "item" : "items"}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full border w-fit ${meta.badgeClass}`}>
          {meta.label}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded w-fit ${category.is_published ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-muted text-muted-foreground'}`}>
          {category.is_published ? 'Published' : 'Draft'}
        </span>
        <span className="text-xs text-muted-foreground truncate">—</span>
        <div className="min-w-0" onClick={(e) => e.stopPropagation()}>
          <OwnerPicker
            value={category.owner_id}
            ownerDisplay={category.owner}
            onChange={(id) => updateCategory.mutate({ id: category.id, owner_id: id })}
          />
        </div>

        <div className="flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(category); }}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRename(); }}>
                <Type className="h-4 w-4 mr-2" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(); }}>
                <Copy className="h-4 w-4 mr-2" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger onClick={(e) => e.stopPropagation()}>
                  <Tag className="h-4 w-4 mr-2" /> Change category
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleChangeCategory("company"); }}>
                    Company
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleChangeCategory("policy"); }}>
                    Policy
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleChangeCategory("procedure"); }}>
                    Procedure
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCopyLink(); }}>
                <Link2 className="h-4 w-4 mr-2" /> Copy link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePrint(); }}>
                <Printer className="h-4 w-4 mr-2" /> Print PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTogglePublish(category); }}>
                {category.is_published ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {category.is_published ? "Unpublish" : "Publish"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleArchive(); }}>
                <Archive className="h-4 w-4 mr-2" /> Archive
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(category.id); }}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {expanded && (
        <WikiArticleList
          categoryId={category.id}
          onEditArticle={onEditArticle}
          searchQuery={searchQuery}
        />
      )}
    </div>
  );
};

export default WikiCategoryRow;
