"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Edit, Trash2, BookOpen, GraduationCap, UserRound } from "lucide-react";
import { deleteSubject } from "@/app/actions/subject-actions";
import { toast } from "sonner";
import { WorkspaceModal } from "@/components/ui/workspace-modal";
import { SubjectForm } from "./subject-form";

interface SubjectItem {
  id: string;
  name: string;
  code: string | null;
  classSubjects?: {
    classId: string;
    class: { name: string; level: string };
    isElective: boolean;
    teacher: {
      id: string;
      staffId: string | null;
      user: { name: string };
    } | null;
    studentEnrollments: { studentId: string }[];
  }[];
}

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

interface SubjectListProps {
  initialSubjects: SubjectItem[];
  classes: ClassOption[];
  teachers: TeacherOption[];
}

export function SubjectList({ initialSubjects, classes, teachers }: SubjectListProps) {
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(
    null,
  );
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(() => new Set());

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects((previous) => {
      const next = new Set(previous);
      if (next.has(subjectId)) next.delete(subjectId);
      else next.add(subjectId);
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this subject?")) {
      try {
        await deleteSubject(id);
        toast.success("Subject deleted successfully");
      } catch {
        toast.error("Failed to delete subject");
      }
    }
  };

  const isJuniorSecondary = (className: string, level: string) =>
    /^(?:JSS|JUNIOR(?:\s+SECONDARY)?)\s*[-_]?\s*[1-3](?:\s*[A-Z])?$/i.test(level.trim()) ||
    /^(?:JSS|JUNIOR(?:\s+SECONDARY)?)\s*[-_]?\s*[1-3](?:\s*[A-Z])?$/i.test(className.trim());

  return (
    <>
      {initialSubjects.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center text-muted-foreground">
          <BookOpen className="h-10 w-10 opacity-30" />
          <p className="text-base font-medium">No subjects found.</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {initialSubjects.map((subject) => {
            const offerings = subject.classSubjects ?? [];
            const isExpanded = expandedSubjects.has(subject.id);
            const hasElectiveOffering = offerings.some(
              (offering) => offering.isElective && !isJuniorSecondary(offering.class.name, offering.class.level),
            );

            return (
              <article key={subject.id} className="min-w-0 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="break-words text-xl font-bold leading-tight text-foreground sm:text-2xl">{subject.name}</h2>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-md border bg-muted px-2.5 py-1 font-mono text-sm font-semibold text-foreground">
                          {subject.code || "No code"}
                        </span>
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          {offerings.length} class{offerings.length === 1 ? "" : "es"}
                        </span>
                        {hasElectiveOffering && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">Elective</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-10 gap-1.5 px-3"
                      onClick={() => toggleSubject(subject.id)}
                      aria-label={`${isExpanded ? "Hide" : "Show"} class assignments for ${subject.name}`}
                      aria-expanded={isExpanded}
                      aria-controls={`subject-assignments-${subject.id}`}
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      <span className="text-xs">{isExpanded ? "Hide" : "Classes"}</span>
                    </Button>
                    <Button variant="outline" size="sm" className="min-h-10 gap-2 px-3" onClick={() => setEditingSubject(subject)} aria-label={`Edit ${subject.name}`}>
                      <Edit className="h-4 w-4" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="min-h-10 gap-2 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(subject.id)} aria-label={`Delete ${subject.name}`}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                </header>

                <section
                  id={`subject-assignments-${subject.id}`}
                  hidden={!isExpanded}
                  className="mt-5 border-t pt-4"
                >
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    Class assignments
                  </div>
                  {offerings.length ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {offerings.map((offering) => (
                        <div key={offering.classId} className="min-w-0 rounded-xl border bg-muted/20 p-3.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-base font-bold">{offering.class.name}</span>
                            {offering.isElective && !isJuniorSecondary(offering.class.name, offering.class.level) && (
                              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">Elective</span>
                            )}
                          </div>
                          <div className="mt-2 flex min-w-0 items-center gap-2 text-sm">
                            <UserRound className="h-4 w-4 shrink-0 text-primary" />
                            <span className="truncate font-medium">{offering.teacher?.user.name ?? "No teacher assigned"}</span>
                          </div>
                          {offering.teacher?.staffId && <p className="ml-6 mt-0.5 text-xs text-muted-foreground">Staff ID: {offering.teacher.staffId}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">This subject is not assigned to any classes yet.</p>
                  )}
                </section>
              </article>
            );
          })}
        </div>
      )}

      <WorkspaceModal
        open={!!editingSubject}
        onOpenChange={(open) => !open && setEditingSubject(null)}
        title="Edit subject"
        description="Update subject details and class or elective assignments."
        size="wide"
      >
        {editingSubject && (
          <SubjectForm
            key={editingSubject.id}
            classes={classes}
            teachers={teachers}
            initialData={{
              id: editingSubject.id,
              name: editingSubject.name,
              code: editingSubject.code || "",
              offerings: classes.map((cls) => {
                const offering = editingSubject.classSubjects?.find(
                  (classSubject) => classSubject.classId === cls.id,
                );
                return {
                  classId: cls.id,
                  enabled: Boolean(offering),
                  isElective: offering?.isElective ?? false,
                  teacherId: offering?.teacher?.id ?? null,
                  studentIds: offering?.studentEnrollments.map(
                    (enrollment) => enrollment.studentId,
                  ) ?? [],
                };
              }),
            }}
            onSuccess={() => setEditingSubject(null)}
          />
        )}
      </WorkspaceModal>
    </>
  );
}
