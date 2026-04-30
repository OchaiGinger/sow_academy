import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  accent?: boolean;
}

export function StatsCard({ label, value, change, trend, accent }: StatsCardProps) {
  return (
    <div className="bg-bg-surface border border-border-subtle p-5 rounded-sm">
      <p className="text-text-secondary text-2xs uppercase tracking-widest font-bold mb-3">
        {label}
      </p>
      <div className="flex items-baseline justify-between">
        <h3 className={cn(
          "text-2xl font-mono tabular-nums font-bold",
          accent ? "text-primary" : "text-text-primary"
        )}>
          {value}
        </h3>
        {change && (
          <span className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded-sm",
            trend === "up" ? "text-success bg-success/10" :
            trend === "down" ? "text-danger bg-danger/10" :
            "text-text-tertiary bg-bg-elevated"
          )}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
}
