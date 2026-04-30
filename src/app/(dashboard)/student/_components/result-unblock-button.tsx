"use client";

// app/(dashboard)/student/_components/result-unlock-button.tsx
// Drop-in replacement for the static "View Result" link in results/page.tsx.
// Shows a modal that calls verifyResultCode, sets the cookie, then navigates.

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, ChevronRight, Loader2, X, KeyRound } from "lucide-react";
import { verifyResultCode } from "@/app/actions/result-actions"; // adjust path as needed

interface Props {
  termId: string;
  classId: string;
}

export function ResultUnlockButton({ termId, classId }: Props) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Auto-focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setCode("");
      setError(null);
    }
  }, [open]);

  function handleSubmit() {
    if (code.trim().length < 4) {
      setError("Please enter a valid clearance code.");
      return;
    }

    startTransition(async () => {
      const result = await verifyResultCode(
        termId,
        classId,
        code.trim().toUpperCase(),
      );

      if (!result.success) {
        setError(result.error ?? "Invalid code. Try again.");
        return;
      }

      // Cookie is now set server-side — navigate to the result card.
      // ⚠️  Path is singular "result", not "results"
      router.push(`/student/results/${termId}`);
    });
  }

  return (
    <>
      {/* Trigger button — same visual style as the original Link */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black uppercase tracking-wider px-4 py-2.5 rounded-sm transition-colors"
      >
        <FileText className="w-3.5 h-3.5" />
        View Result
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          {/* Modal */}
          <div className="relative w-full max-w-sm mx-4 bg-bg-surface border border-border-subtle rounded-sm shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] font-black uppercase tracking-widest text-text-primary">
                  Clearance Code
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-6 space-y-5">
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter the 6-digit clearance code provided by your Form Master to
                unlock this result card.
              </p>

              <input
                ref={inputRef}
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="ENTER CODE"
                maxLength={12}
                autoComplete="off"
                spellCheck={false}
                className="w-full p-3 bg-bg-input border border-border-default text-center font-mono font-bold tracking-[0.3em] uppercase text-sm rounded-sm focus:ring-1 focus:ring-amber-500/60 outline-none text-text-primary placeholder:text-slate-600 transition"
              />

              {error && (
                <p className="text-[11px] text-red-400 font-bold text-center -mt-2">
                  {error}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={isPending || code.trim().length === 0}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black text-[11px] font-black uppercase tracking-wider py-3 rounded-sm transition-colors"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    Unlock Result
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
