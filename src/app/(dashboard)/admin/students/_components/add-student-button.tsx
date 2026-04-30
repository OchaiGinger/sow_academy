// src/app/admin/students/_components/add-student-button.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StudentForm } from "./student-form";

interface AddStudentButtonProps {
  classes: any[];
  initialData?: any; // If this exists, we are editing
  mode?: "add" | "edit";
}

export function AddStudentButton({
  classes,
  initialData,
  mode = "add",
}: AddStudentButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "add" ? (
          <Button size="sm" className="font-bold">
            <Plus className="mr-2 h-4 w-4" />
            ADMIT STUDENT
          </Button>
        ) : (
          <button className="text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase">
            Edit
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Student Record" : "New Student Admission"}
          </DialogTitle>
        </DialogHeader>
        <StudentForm
          classes={classes}
          initialData={initialData}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
