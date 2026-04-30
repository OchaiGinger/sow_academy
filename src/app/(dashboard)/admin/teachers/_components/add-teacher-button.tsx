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
import { TeacherForm } from "./teacher-form";

interface Props {
  availableSubjects: any[];
}

export function AddTeacherButton({ availableSubjects }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="font-bold uppercase tracking-wider text-xs">
          <Plus className="mr-2 h-4 w-4" /> Add Teacher
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="uppercase tracking-widest font-bold">
            New Teacher Profile
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <TeacherForm
            availableSubjects={availableSubjects}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
