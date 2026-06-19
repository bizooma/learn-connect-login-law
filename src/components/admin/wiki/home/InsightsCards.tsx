import { Card } from "@/components/ui/card";
import { useHomeInsights, type WeeklyBucket } from "@/hooks/useWikiHomeStats";

const BarChart = ({ buckets }: { buckets: WeeklyBucket[] }) => {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div className="flex items-end gap-3 h-24 mt-3">
      {buckets.map((b) => (
        <div key={b.start} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex justify-center items-end h-full">
            <div
              className="w-3 rounded-sm bg-primary"
              style={{ height: `${(b.count / max) * 100}%`, minHeight: 2 }}
              title={`${b.label}: ${b.count}`}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{b.label}</span>
        </div>
      ))}
    </div>
  );
};

const StatCard = ({
  title,
  total,
  buckets,
  subtitle,
}: {
  title: string;
  total: number;
  buckets: WeeklyBucket[];
  subtitle?: string;
}) => (
  <Card className="p-4">
    <div className="flex items-baseline justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">Last 4 weeks</p>
      </div>
    </div>
    <BarChart buckets={buckets} />
    <div className="mt-3 flex items-baseline gap-2">
      <span className="text-2xl font-bold text-foreground">{total}</span>
      {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
    </div>
  </Card>
);

const InsightsCards = () => {
  const { data, isLoading } = useHomeInsights();

  if (isLoading || !data) {
    return (
      <section>
        <h3 className="text-lg font-semibold text-foreground mb-3">Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 h-44 animate-pulse bg-muted/30" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <h3 className="text-lg font-semibold text-foreground mb-3">Insights</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Active readers"
          total={data.activeUsersTotal}
          buckets={data.activeUsersByWeek}
          subtitle="distinct"
        />
        <StatCard
          title="Articles viewed"
          total={data.viewsTotal}
          buckets={data.viewsByWeek}
          subtitle="total views"
        />
        <StatCard
          title="Searches made"
          total={data.searchesTotal}
          buckets={data.searchesByWeek}
          subtitle="tracking soon"
        />
      </div>
    </section>
  );
};

export default InsightsCards;
