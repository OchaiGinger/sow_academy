// stamping-client.tsx
"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, Timer } from "lucide-react";
import { bulkStampResults } from "@/app/actions/result-actions";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation"; // ← add

export function StampingClient({
  classes,
  termId,
}: {
  classes: any[];
  termId: string;
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter(); // ← add

  const handleStamp = async (classId: string) => {
    setLoadingId(classId);
    const res = await bulkStampResults(classId, termId);

    if (res.success) {
      toast.success(
        res.count > 0
          ? `Successfully sealed ${res.count} result${res.count !== 1 ? "s" : ""}!`
          : "Nothing to seal — all results already stamped.",
      );
      router.refresh(); // ← re-fetches server data so counts update immediately
    } else {
      toast.error(res.error ?? "Something went wrong.");
    }

    setLoadingId(null);
  };

  return (
    <div className="grid gap-4">
      {classes.map((cls) => {
        const hasPending = cls.pendingStampCount > 0; // ✅ was: approvedCount > 0
        const isLoading = loadingId === cls.id;

        return (
          <div
            key={cls.id}
            className="bg-bg-surface border border-border-subtle p-6 rounded-sm flex items-center justify-between"
          >
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-text-primary">
                {cls.name}
              </h3>
              <div className="flex items-center gap-4 text-xs text-text-tertiary">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-success" />
                  {cls.approvedCount} Approved by Form Master
                </span>
                <span className="flex items-center gap-1">
                  <Timer className="w-3 h-3 text-warning" />
                  {cls.pendingStampCount} Pending Seal
                </span>
              </div>
            </div>

            <Button
              disabled={!hasPending || isLoading} // ✅ correct condition
              onClick={() => handleStamp(cls.id)}
              className={
                hasPending
                  ? "bg-primary text-bg-base"
                  : "bg-bg-elevated text-text-tertiary cursor-not-allowed"
              }
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              {isLoading ? "Sealing…" : "Apply Official Seal"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
