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
          "h-11 border-2 border-black bg-white text-base font-black text-black shadow-sm hover:border-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 data-[placeholder]:text-black",
          compact ? "px-2" : "w-full px-3",
        )}
      >
        <SelectValue>{displayValue}</SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-60 border-2 border-black bg-white text-black shadow-xl">
        {options.map((opt) => (
          <SelectItem
            key={opt}
            value={opt}
            className="min-h-10 cursor-pointer text-sm font-bold text-black focus:bg-gray-200 focus:text-black"
          >
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
