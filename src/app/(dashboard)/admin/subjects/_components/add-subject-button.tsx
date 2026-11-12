"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SubjectForm } from "./subject-form";

interface ClassOption {
  id: string;
  name: string;
  students: { id: string; name: string }[];
}

interface TeacherOption {
  id: string;
  staffId: string | null;
  user: { name: string };
}

export function AddSubjectButton({ classes, teachers }: { classes: ClassOption[]; teachers: TeacherOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Subject
        </Button>
      </SheetTrigger>
      <SheetContent className="flex h-dvh w-full max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <SheetHeader className="shrink-0 border-b px-5 py-5 pr-14 text-left sm:px-7">
          <SheetTitle className="text-xl font-bold tracking-tight">Create a subject</SheetTitle>
          <p className="text-sm text-muted-foreground">Set the subject details, then choose where it is taught.</p>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col">
          <SubjectForm classes={classes} teachers={teachers} onSuccess={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
