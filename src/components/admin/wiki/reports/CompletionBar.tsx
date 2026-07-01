import { cn } from "@/lib/utils";

interface Props {
  pct: number;
  showLabel?: boolean;
  className?: string;
}

export const barColor = (pct: number) => {
  if (pct >= 70) return "bg-emerald-500";
  if (pct >= 40) return "bg-amber-500";
  return "bg-rose-500";
};

const CompletionBar = ({ pct, showLabel = true, className }: Props) => {
  const p = Math.max(0, Math.min(100, pct || 0));
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full transition-all", barColor(p))} style={{ width: `${p}%` }} />
      </div>
      {showLabel && (
        <span className="text-xs font-medium w-10 text-right tabular-nums">{p}%</span>
      )}
    </div>
  );
};

export default CompletionBar;
