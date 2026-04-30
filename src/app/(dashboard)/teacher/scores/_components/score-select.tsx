"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ScoreSelectProps {
  value: number;
  options: string[];
  onChange: (v: number) => void;
  compact?: boolean;
}

export function ScoreSelect({
  value,
  options,
  onChange,
  compact = false,
}: ScoreSelectProps) {
  const displayValue = value % 1 === 0 ? String(value) : value.toFixed(1);

  return (
    <Select value={displayValue} onValueChange={(v) => onChange(parseFloat(v))}>
      <SelectTrigger
        className={cn(
          "bg-[#050f08] border-emerald-900/60 text-white hover:border-emerald-600/60 focus:ring-emerald-500/30 focus:border-emerald-600 transition-colors h-7 text-xs",
          compact ? "px-1.5" : "px-2 w-full",
        )}
      >
        <SelectValue>{displayValue}</SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-[#0a1f14] border-emerald-900/60 max-h-48">
        {options.map((opt) => (
          <SelectItem
            key={opt}
            value={opt}
            className="text-xs text-white hover:bg-emerald-900/40 focus:bg-emerald-900/40 cursor-pointer"
          >
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
