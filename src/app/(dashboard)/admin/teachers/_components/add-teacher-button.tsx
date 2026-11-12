"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceModal } from "@/components/ui/workspace-modal";
import { TeacherForm } from "./teacher-form";

interface Props {
  availableSubjects: AvailableSubject[];
}

type AvailableSubject = {
  id: string;
  class: { name: string } | null;
  subject: { name: string } | null;
  teacherId: string | null;
};

export function AddTeacherButton({ availableSubjects }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        className="font-bold uppercase tracking-wider text-xs"
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-2 h-4 w-4" /> Add Teacher
      </Button>
      <WorkspaceModal
        open={open}
        onOpenChange={setOpen}
        title="Add a teacher"
        description="Create the staff account, add a profile photo, and assign available class subjects."
        size="wide"
      >
        <TeacherForm
          availableSubjects={availableSubjects.filter((subject) => subject.teacherId === null)}
          onSuccess={() => setOpen(false)}
        />
      </WorkspaceModal>
    </>
  );
}
