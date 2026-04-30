"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  Pencil,
  Plus,
  Trash2,
  CalendarDays,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  deleteSession,
  deleteTerm,
  setCurrentSession,
  setCurrentTerm,
} from "@/app/actions/session-action";
import { SessionForm } from "./session-form";
import { TermForm } from "./term-form";
import { ScoreWindowManager } from "./score-window-manager";
import { cn } from "@/lib/utils";

type Sessions = any;

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── One discriminated-union state drives every sheet in the component ────────
type SheetState =
  | { type: "addTerm"; sessionId: string }
  | { type: "scoreWindow"; termId: string }
  | { type: "editSession" }
  | null;

export function SessionList({
  initialSessions,
}: {
  initialSessions: Sessions;
}) {
  const router = useRouter();
  const refresh = () => router.refresh();

  // A single sheet rendered once at the top level.
  // Multiple nested <Sheet> components share the same Radix portal and
  // focus-trap, which is why "Add Term" was accidentally opening the
  // ScoreWindowManager sheet that happened to be rendered nearby.
  const [sheet, setSheet] = useState<SheetState>(null);
  const closeSheet = () => setSheet(null);

  return (
    <>
      {/* ── Shared Sheet ─────────────────────────────────────────────────── */}
      <Sheet
        open={sheet !== null}
        onOpenChange={(open) => !open && closeSheet()}
      >
        <SheetContent className="overflow-y-auto w-full sm:max-w-[60vw]">
          {sheet?.type === "addTerm" && (
            <>
              <SheetHeader>
                <SheetTitle>Add New Term</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <TermForm
                  sessionId={sheet.sessionId}
                  onSuccess={() => {
                    closeSheet();
                    refresh();
                  }}
                />
              </div>
            </>
          )}

          {sheet?.type === "scoreWindow" && (
            <>
              <SheetHeader>
                <SheetTitle>Score Entry Windows</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <ScoreWindowManager termId={sheet.termId} />
              </div>
            </>
          )}

          {sheet?.type === "editSession" && (
            <>
              <SheetHeader>
                <SheetTitle>New Session</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                {/* SessionForm is create-only — no session prop */}
                <SessionForm
                  onSuccess={() => {
                    closeSheet();
                    refresh();
                  }}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── List ─────────────────────────────────────────────────────────── */}
      <div className="space-y-6 w-full">
        {initialSessions.map((session: any) => (
          <div
            key={session.id}
            className="border rounded-xl bg-card shadow-sm overflow-hidden w-full"
          >
            {/* SESSION HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-4 sm:px-6 bg-muted/20 border-b">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "p-2 rounded-lg shrink-0",
                    session.isCurrent
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <CalendarDays size={20} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-lg leading-none truncate">
                    {session.name}
                  </span>
                  {session.isCurrent && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary mt-1">
                      Active Session
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {!session.isCurrent && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-semibold"
                    onClick={() => setCurrentSession(session.id).then(refresh)}
                  >
                    Set Current
                  </Button>
                )}

                <div className="flex items-center gap-1 bg-background/50 p-1 rounded-md border">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    title="New session"
                    onClick={() => setSheet({ type: "editSession" })}
                  >
                    <Pencil size={14} />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Session?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete{" "}
                          <strong>{session.name}</strong> and all its terms.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() =>
                            deleteSession(session.id).then(refresh)
                          }
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>

            {/* TERMS */}
            <div className="divide-y divide-border/50">
              {session.terms.map((term: any) => (
                <div
                  key={term.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:px-6 hover:bg-muted/5 transition-colors w-full overflow-hidden"
                >
                  <div className="flex items-start gap-4 min-w-0 w-full lg:w-auto">
                    <div className="mt-1 shrink-0">
                      {term.isCurrent ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground/30" />
                      )}
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm sm:text-base capitalize truncate">
                          {term.name.toLowerCase()} Term
                        </p>
                        {term.isCurrent && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-5 bg-emerald-500/10 text-emerald-600 border-none shrink-0"
                          >
                            Active
                          </Badge>
                        )}
                      </div>
                      {term.startDate && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <CalendarDays size={12} className="shrink-0" />
                          {formatDate(term.startDate)} —{" "}
                          {formatDate(term.endDate!)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
                    {!term.isCurrent && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-8"
                        onClick={() => setCurrentTerm(term.id).then(refresh)}
                      >
                        Set Active
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8"
                      onClick={() =>
                        setSheet({ type: "scoreWindow", termId: term.id })
                      }
                    >
                      Score Windows
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Term?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete{" "}
                            <strong>{term.name}</strong> and all associated
                            scores. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteTerm(term.id).then(refresh)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}

              {/* ADD TERM — plain button, no nested Sheet */}
              <div className="p-3 bg-muted/5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-primary border border-dashed border-primary/20"
                  onClick={() =>
                    setSheet({ type: "addTerm", sessionId: session.id })
                  }
                >
                  <Plus size={16} />
                  <span className="text-xs font-bold truncate">
                    Add New Term to {session.name}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
