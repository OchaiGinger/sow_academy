"use client";

import { useState } from "react";
import { Plus, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TeacherForm } from "./teacher-form";

interface Props {
  availableSubjects: AvailableSubject[];
}

type AvailableSubject = {
  id: string;
  class: { name: string } | null;
  subject: { name: string } | null;
};

export function AddTeacherButton({ availableSubjects }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="font-bold uppercase tracking-wider text-xs">
          <Plus className="mr-2 h-4 w-4" /> Add Teacher
        </Button>
      </SheetTrigger>
      <SheetContent className="!inset-0 flex !h-dvh !w-screen !max-w-none flex-col gap-0 overflow-hidden rounded-none p-0">
        <SheetHeader className="shrink-0 border-b bg-background px-5 py-4 pr-14 text-left sm:px-8 sm:py-5">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <UserRound className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Staff onboarding</p>
              <SheetTitle className="mt-0.5 text-xl font-bold tracking-tight sm:text-2xl">
                Add a teacher
              </SheetTitle>
              <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
                Create the staff account, add a profile photo, and assign class subjects.
              </p>
            </div>
            <div className="ml-auto hidden rounded-lg border bg-muted/30 px-4 py-2 text-right sm:block">
              <p className="text-xs font-semibold">One simple setup</p>
              <p className="text-[11px] text-muted-foreground">Profile · Photo · Teaching assignments</p>
            </div>
          </div>
        </SheetHeader>
        <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col">
          <TeacherForm
            availableSubjects={availableSubjects}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
