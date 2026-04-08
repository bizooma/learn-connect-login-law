import { BookOpen, Home, FolderOpen, ChevronRight, Plus } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

interface WikiCategory {
  id: string;
  title: string;
  icon: string | null;
  article_count?: number;
}

interface WikiSidebarProps {
  categories: WikiCategory[];
  activeCategoryId: string | null;
  onCategorySelect: (id: string | null) => void;
  onCreateCategory: () => void;
}

const WikiSidebar = ({ categories, activeCategoryId, onCategorySelect, onCreateCategory }: WikiSidebarProps) => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Policies & Procedures</span>
          </div>
        )}
        {collapsed && <BookOpen className="h-5 w-5 text-primary mx-auto" />}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onCategorySelect(null)}
                  className={`${!activeCategoryId ? 'bg-accent text-accent-foreground font-medium' : ''}`}
                >
                  <Home className="h-4 w-4" />
                  {!collapsed && <span>All Content</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup defaultOpen>
          <SidebarGroupLabel className="flex items-center justify-between">
            {!collapsed && <span>Categories</span>}
            {!collapsed && (
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onCreateCategory}>
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {categories.length === 0 && !collapsed && (
                <p className="px-3 py-2 text-xs text-muted-foreground">No categories yet</p>
              )}
              {categories.map((category) => (
                <SidebarMenuItem key={category.id}>
                  <SidebarMenuButton
                    onClick={() => onCategorySelect(category.id)}
                    className={`${activeCategoryId === category.id ? 'bg-accent text-accent-foreground font-medium' : ''}`}
                  >
                    <FolderOpen className="h-4 w-4" />
                    {!collapsed && (
                      <div className="flex items-center justify-between flex-1 min-w-0">
                        <span className="truncate">{category.title}</span>
                        {category.article_count !== undefined && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {category.article_count}
                          </span>
                        )}
                      </div>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default WikiSidebar;
