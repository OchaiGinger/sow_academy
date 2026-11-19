"use client";

import { useState } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateStudentSubjects } from "@/app/actions/student-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

interface SubjectOffering {
  id: string;
  isElective: boolean;
  subject: { name: string; code: string | null };
}

interface Props {
  studentId: string;
  studentName: string;
  className: string;
  offerings: SubjectOffering[];
  selectedElectiveIds: string[];
}

export function StudentSubjectsButton({
  studentId,
  studentName,
  className,
  offerings,
  selectedElectiveIds,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState(selectedElectiveIds);
  const [saving, setSaving] = useState(false);
  const electiveOfferings = offerings.filter((offering) => offering.isElective);
  const subjectCount = offerings.filter((offering) =>
    !offering.isElective || selectedIds.includes(offering.id),
  ).length;

  async function toggleElective(classSubjectId: string, checked: boolean) {
    if (saving) return;
    const nextIds = checked
      ? [...new Set([...selectedIds, classSubjectId])]
      : selectedIds.filter((id) => id !== classSubjectId);
    const previousIds = selectedIds;
    setSelectedIds(nextIds);
    setSaving(true);
    const result = await updateStudentSubjects(studentId, nextIds);
    setSaving(false);

    if (!result.success) {
      setSelectedIds(previousIds);
      toast.error(result.error);
      return;
    }

    toast.success("Student subjects updated");
    router.refresh();
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 px-2 text-xs"
        onClick={() => setOpen(true)}
        aria-label={`Manage subjects for ${studentName}`}
      >
        <BookOpen className="h-3.5 w-3.5" />
        {subjectCount}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Subjects offered</DialogTitle>
            <DialogDescription>
              {studentName} · {className}. Required subjects are always included. Check or uncheck electives to update this student immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
            <span className="text-sm font-medium">Current subject total</span>
            <Badge variant="secondary">{subjectCount} subjects</Badge>
          </div>

          <div className="divide-y rounded-lg border">
            {offerings.map((offering) => {
              const checked = !offering.isElective || selectedIds.includes(offering.id);
              return (
                <label
                  key={offering.id}
                  className={`flex items-center gap-3 px-3 py-3 ${offering.isElective ? "cursor-pointer hover:bg-muted/40" : "cursor-not-allowed bg-muted/20"}`}
                >
                  <Checkbox
                    checked={checked}
                    disabled={!offering.isElective || saving}
                    onCheckedChange={(value) => toggleElective(offering.id, value === true)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{offering.subject.name}</span>
                    {offering.subject.code && (
                      <span className="block text-xs text-muted-foreground">{offering.subject.code}</span>
                    )}
                  </span>
                  <Badge variant={offering.isElective ? "outline" : "secondary"}>
                    {offering.isElective ? "Elective" : "Required"}
                  </Badge>
                  {saving && offering.isElective && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </label>
              );
            })}
            {offerings.length === 0 && (
              <p className="p-4 text-center text-sm text-muted-foreground">No subjects are assigned to {className} yet.</p>
            )}
          </div>
          {electiveOfferings.length === 0 && offerings.length > 0 && (
            <p className="text-xs text-muted-foreground">This class has no elective subjects to change.</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
