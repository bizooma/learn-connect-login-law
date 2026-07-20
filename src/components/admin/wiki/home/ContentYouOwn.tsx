import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useContentYouOwn } from "@/hooks/useWikiHomeStats";
import { withPreviewAsStaffParam } from "@/hooks/usePreviewAsStaff";

const ContentYouOwn = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useContentYouOwn(user?.id);

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold text-foreground mb-4">Content you own</h3>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
      ) : !data || data.length === 0 ? (
        <div className="flex flex-col items-center text-center py-10">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-foreground font-medium">You haven't created any content yet.</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Start by creating your first article or subject.
          </p>
          <Button onClick={() => navigate(withPreviewAsStaffParam("/admin/wiki/content"))} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Create
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {data.slice(0, 8).map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-2.5">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {a.category_title ?? "Uncategorized"}
                </p>
              </div>
              {a.is_published ? (
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                  Published
                </Badge>
              ) : (
                <Badge variant="secondary">Draft</Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export default ContentYouOwn;
