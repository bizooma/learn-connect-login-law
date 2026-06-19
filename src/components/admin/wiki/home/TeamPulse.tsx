import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, FileWarning, FolderOpen } from "lucide-react";
import { useTeamPulse } from "@/hooks/useWikiHomeStats";

const iconFor = (kind: string) => {
  switch (kind) {
    case "overdue_review":
      return <Clock className="h-4 w-4 text-amber-600" />;
    case "draft_stale":
      return <FileWarning className="h-4 w-4 text-orange-600" />;
    case "empty_subject":
      return <FolderOpen className="h-4 w-4 text-blue-600" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

const TeamPulse = () => {
  const { data, isLoading } = useTeamPulse();

  return (
    <section>
      <h3 className="text-lg font-semibold text-foreground mb-3">Team pulse</h3>
      <Card className="p-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading insights…</p>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing urgent right now. Your content is up to date.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {data.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                  {iconFor(item.kind)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">{item.badge}</Badge>
                    <span className="text-xs text-muted-foreground truncate">{item.context}</span>
                    {item.age_days > 0 && (
                      <span className="text-xs text-muted-foreground">· {item.age_days}d ago</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
};

export default TeamPulse;
