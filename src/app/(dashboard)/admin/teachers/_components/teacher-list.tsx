"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Trash2,
  Mail,
  Hash,
  BookOpen,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import {
  deleteTeacher,
  togglePrincipalRole,
} from "@/app/actions/teacher-actions";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TeacherForm } from "./teacher-form";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Define the exact structure expected from the Database
interface TeacherItem {
  id: string; // Teacher Record ID
  userId: string; // User Record ID
  staffId: string | null;
  user: {
    id: string; // User ID (mapped to userId)
    name: string;
    email: string;
    role: string; // Must be selected in Prisma query
    phone: string | null;
    image: string | null;
  };
  _count: {
    classSubjects: number;
  };
  classSubjects: { id: string }[];
  formMasters: { class: { name: string } }[];
}

type AvailableSubject = {
  id: string;
  class: { name: string } | null;
  subject: { name: string } | null;
  teacherId: string | null;
};

export function TeacherList({
  initialData,
  allSubjects,
}: {
  initialData: TeacherItem[];
  allSubjects: AvailableSubject[];
}) {
  const [editingTeacher, setEditingTeacher] = useState<TeacherItem | null>(
    null,
  );
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const filteredTeachers = normalizedQuery
    ? initialData.filter(
        (t) =>
          t.user.name.toLowerCase().includes(normalizedQuery) ||
          t.user.email.toLowerCase().includes(normalizedQuery) ||
          (t.staffId ?? "").toLowerCase().includes(normalizedQuery),
      )
    : initialData;
  const handleTogglePrincipal = async (userId: string, currentRole: string) => {
    const isPromoting = currentRole !== "PRINCIPAL";
    const confirmMsg = isPromoting
      ? "Promote this teacher to Principal? They will have authority to apply official school stamps."
      : "Revoke Principal authority? They will return to a standard Teacher role.";

    if (confirm(confirmMsg)) {
      const res = await togglePrincipalRole(userId, isPromoting);
      if (res.success) {
        toast.success(
          isPromoting
            ? "Role updated to Principal"
            : "Role reverted to Teacher",
        );
      } else {
        toast.error(res.error || "Failed to update role");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (
      confirm(
        "Are you sure? This will remove the teacher's profile and unassign their subjects.",
      )
    ) {
      const res = await deleteTeacher(id);
      if (res.success) {
        toast.success("Teacher profile removed");
      } else {
        toast.error(res.error);
      }
    }
  };

  return (
    <>
      <div className="border-b border-border-subtle p-3 bg-bg-surface">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email or staff ID..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>
      <Accordion type="multiple" className="divide-y divide-border-subtle">
        {initialData.length === 0 ? (
          <p className="py-12 text-center text-sm italic text-text-tertiary">
            No teacher profiles found in the system.
          </p>
        ) : filteredTeachers.length === 0 ? (
          <p className="py-12 text-center text-sm italic text-text-tertiary">
            No teachers match &quot;{query}&quot;.
          </p>
        ) : (
          filteredTeachers.map((teacher) => {
            const assignedSubjects = allSubjects.filter(
              (subject) => subject.teacherId === teacher.id,
            );

            return (
              <AccordionItem key={teacher.id} value={teacher.id} className="border-0">
                <div className="flex items-center gap-2 px-3 transition-colors hover:bg-bg-elevated/50 sm:px-4">
                  <AccordionTrigger className="min-w-0 flex-1 gap-3 py-4 text-left hover:no-underline">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar className="h-9 w-9 shrink-0 rounded-sm border border-border-subtle">
                        <AvatarImage src={teacher.user.image || ""} />
                        <AvatarFallback className="rounded-sm bg-primary/10 text-xs font-bold text-primary">
                          {teacher.user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-text-primary">{teacher.user.name}</span>
                          {teacher.user.role === "PRINCIPAL" && (
                            <Badge className="h-4 border-none bg-primary/10 px-1.5 text-[8px] font-bold uppercase text-primary">Principal</Badge>
                          )}
                          {teacher.formMasters.length > 0 && (
                            <Badge className="h-auto border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[8px] font-bold uppercase text-amber-700">
                              Form Master — {teacher.formMasters.map(({ class: assignedClass }) => assignedClass.name).join(", ")}
                            </Badge>
                          )}
                        </div>
                        <span className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-text-tertiary">
                          <Mail className="h-2.5 w-2.5 shrink-0" /> {teacher.user.email}
                        </span>
                      </div>
                    </div>
                    <div className="hidden shrink-0 items-center gap-1.5 font-mono text-xs font-bold text-primary sm:flex">
                      <Hash className="h-3 w-3 text-text-tertiary" />
                      {teacher.staffId || "---"}
                    </div>
                    <div className="mr-2 inline-flex shrink-0 items-center gap-2 rounded border border-border-subtle bg-bg-elevated px-2 py-1">
                      <BookOpen className="h-3 w-3 text-primary" />
                      <span className="text-xs font-bold">{assignedSubjects.length}</span>
                      <span className="hidden text-[10px] text-text-tertiary sm:inline">subjects</span>
                    </div>
                  </AccordionTrigger>

                  <div className="flex shrink-0 items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${teacher.user.role === "PRINCIPAL" ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-text-tertiary hover:text-primary"}`}
                      onClick={() => handleTogglePrincipal(teacher.user.id, teacher.user.role)}
                      title={teacher.user.role === "PRINCIPAL" ? "Revoke Principal Role" : "Make Principal"}
                    >
                      {teacher.user.role === "PRINCIPAL" ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                      onClick={() => setEditingTeacher(teacher)}
                      title="Edit Teacher"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(teacher.id)}
                      title="Delete Teacher"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <AccordionContent className="bg-bg-elevated/30 px-4 sm:px-6">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Assigned subjects</h3>
                      <span className="text-[10px] text-text-tertiary sm:hidden">Staff ID: {teacher.staffId || "---"}</span>
                      <span className="text-[10px] font-semibold text-text-tertiary">
                        {assignedSubjects.length} subject{assignedSubjects.length === 1 ? "" : "s"} · {teacher.formMasters.length} form-master class{teacher.formMasters.length === 1 ? "" : "es"}
                      </span>
                    </div>
                    {assignedSubjects.length > 0 ? (
                      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {assignedSubjects.map((subject) => (
                          <li key={subject.id} className="flex items-start gap-2 rounded-md border border-border-subtle bg-bg-surface p-3">
                            <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-text-primary">{subject.subject?.name ?? "Subject"}</p>
                              <p className="truncate text-xs text-text-tertiary">{subject.class?.name ?? "Class not assigned"}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="rounded-md border border-dashed border-border-subtle p-4 text-center text-sm text-text-tertiary">
                        No subjects assigned to this teacher yet.
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })
        )}
      </Accordion>

    {/* EDIT SHEET */}
    <Sheet
      open={!!editingTeacher}
      onOpenChange={(open) => !open && setEditingTeacher(null)}
    >
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="uppercase tracking-widest font-bold">
            Edit Teacher Profile
          </SheetTitle>
        </SheetHeader>
        {editingTeacher && (
          <div className="mt-6">
            <TeacherForm
              availableSubjects={allSubjects.filter(
                (cs) =>
                  cs.teacherId === null ||
                  cs.teacherId === editingTeacher.id,
              )}
              initialData={{
                id: editingTeacher.id,
                name: editingTeacher.user.name,
                email: editingTeacher.user.email,
                phone: editingTeacher.user.phone,
                staffId: editingTeacher.staffId,
                classSubjectIds: editingTeacher.classSubjects.map((cs) => cs.id),
              }}
              onSuccess={() => setEditingTeacher(null)}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
    </>
  );
}
