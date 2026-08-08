import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

/**
 * Compact "My Team" summary shown on the admin dashboard for admins who also
 * hold the team_leader role. Links into the full team progress view.
 */
const MyTeamSummaryCard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isTeamLeader, loading: roleLoading } = useUserRole();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.id || !isTeamLeader) return;
    let cancelled = false;

    const fetchCount = async () => {
      const { count: c } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("team_leader_id", user.id)
        .eq("is_deleted", false);
      if (!cancelled) setCount(c || 0);
    };

    fetchCount();
    return () => {
      cancelled = true;
    };
  }, [user?.id, isTeamLeader]);

  if (roleLoading || !isTeamLeader || !count) return null;

  return (
    <Card className="mb-8 border-l-4" style={{ borderLeftColor: "#FFDA00" }}>
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center"
            style={{ background: "#213C82" }}
          >
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold" style={{ color: "#213C82" }}>
              My Team ({count})
            </p>
            <p className="text-sm text-muted-foreground">
              View course progress for the staff who report to you
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate("/team-leader-dashboard")}
          style={{ background: "#213C82" }}
          className="text-white hover:opacity-90"
        >
          View team progress
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default MyTeamSummaryCard;
