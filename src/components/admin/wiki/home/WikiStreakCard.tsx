import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Trophy, Calendar } from "lucide-react";
import { useGamificationSettings } from "@/hooks/useGamificationSettings";

interface Streak {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

const WikiStreakCard = () => {
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);
  const { enabled, isUserExcluded, streakFrequency } = useGamificationSettings();

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) return setLoading(false);
      const { data } = await supabase
        .from("user_wiki_streaks" as any)
        .select("current_streak, longest_streak, last_activity_date")
        .eq("user_id", uid)
        .maybeSingle();
      setStreak((data as any) ?? { current_streak: 0, longest_streak: 0, last_activity_date: null });
      setLoading(false);
    })();
  }, []);

  if (!enabled || isUserExcluded || loading) return null;

  const current = streak?.current_streak ?? 0;
  const longest = streak?.longest_streak ?? 0;
  const last = streak?.last_activity_date
    ? new Date(streak.last_activity_date).toLocaleDateString()
    : "—";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Your Reading Streak
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Flame className="h-3.5 w-3.5" /> Current
            </div>
            <div className="text-2xl font-semibold">{current}<span className="text-sm font-normal text-muted-foreground ml-1">days</span></div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Trophy className="h-3.5 w-3.5" /> Longest
            </div>
            <div className="text-2xl font-semibold">{longest}<span className="text-sm font-normal text-muted-foreground ml-1">days</span></div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Calendar className="h-3.5 w-3.5" /> Last read
            </div>
            <div className="text-sm font-medium pt-1">{last}</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Read at least one page each day to keep your streak alive ({streakFrequency} recognition).
        </p>
      </CardContent>
    </Card>
  );
};

export default WikiStreakCard;
