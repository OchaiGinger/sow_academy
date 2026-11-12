"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceModal } from "@/components/ui/workspace-modal";
import { SubjectForm } from "./subject-form";

interface ClassOption {
  id: string;
  name: string;
  level: string;
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
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Add Subject
      </Button>
      <WorkspaceModal
        open={open}
        onOpenChange={setOpen}
        title="Create a subject"
        description="Set the subject details, then choose where it is taught."
        size="wide"
      >
        <SubjectForm classes={classes} teachers={teachers} onSuccess={() => setOpen(false)} />
      </WorkspaceModal>
    </>
  );
}
