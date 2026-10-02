"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, User, ChevronDown, Users, Trash2 } from "lucide-react";
import { AddStudentButton } from "./add-student-button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { deleteStudent } from "@/app/actions/student-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export type AdminStudent = {
  id: string;
  admissionNo: string;
  classId: string;
  dateOfBirth: Date | null;
  gender: "MALE" | "FEMALE" | null;
  guardianName: string | null;
  guardianPhone: string | null;
  address: string | null;
  user: {
    name: string;
    email: string;
    phone: string | null;
  };
  class: { name: string; level: string; arm: string } | null;
};

interface Props {
  students: AdminStudent[];
  classes: { id: string; name: string; level: string; arm: string }[];
}

const LEVEL_ORDER: Record<string, number> = {
  JSS1: 1,
  JSS2: 2,
  JSS3: 3,
  SS1: 4,
  SS2: 5,
  SS3: 6,
};

function levelRank(level: string) {
  // Guards against dirty values such as the "SS2 " level stored with a
  // trailing space, and any level not present in the map.
  return LEVEL_ORDER[level.trim()] ?? 99;
}

function formatDob(date: Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function StudentList({ students, classes }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [openLevels, setOpenLevels] = useState<Set<string>>(
    new Set(Object.keys(LEVEL_ORDER)),
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminStudent | null>(null);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredStudents = useMemo(() => {
    if (!normalizedQuery) return students;
    return students.filter((s) =>
      [
        s.user.name,
        s.user.email,
        s.admissionNo,
        s.guardianName ?? "",
        s.class?.arm ?? "",
      ].some((field) => field.toLowerCase().includes(normalizedQuery)),
    );
  }, [students, normalizedQuery]);

  // Group by LEVEL, keeping only levels that actually have students.
  const studentsByLevel = useMemo(() => {
    const grouped: Record<string, AdminStudent[]> = {};

    filteredStudents.forEach((student) => {
      const level = student.class?.level?.trim() || "Unassigned";
      if (!grouped[level]) grouped[level] = [];
      grouped[level].push(student);
    });

    return Object.entries(grouped)
      .map(([level, list]) => ({
        level,
        students: [...list].sort((a, b) =>
          a.user.name.localeCompare(b.user.name),
        ),
      }))
      .sort((a, b) => {
        const rankA = levelRank(a.level);
        const rankB = levelRank(b.level);
        if (rankA !== rankB) return rankA - rankB;
        return a.level.localeCompare(b.level);
      });
  }, [filteredStudents]);

  const toggleLevel = (level: string, open: boolean) => {
    setOpenLevels((prev) => {
      const next = new Set(prev);
      if (open) next.add(level);
      else next.delete(level);
      return next;
    });
  };

  const toggleAll = (expand: boolean) => {
    setOpenLevels(expand ? new Set(studentsByLevel.map((g) => g.level)) : new Set());
  };

  async function handleDelete() {
    if (!confirmDelete) return;

    setDeletingId(confirmDelete.id);
    const res = await deleteStudent(confirmDelete.id);
    setDeletingId(null);

    if (res.success) {
      toast.success(`${confirmDelete.admissionNo} deleted`);
      setConfirmDelete(null);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <>
      <div className="border-b bg-card px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative max-w-sm sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, admission no..."
              className="h-8 pl-8 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => toggleAll(true)}
            >
              <ChevronDown className="h-3 w-3 mr-1" /> Expand All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => toggleAll(false)}
            >
              <ChevronDown className="h-3 w-3 mr-1 rotate-90" /> Collapse All
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {students.length === 0 ? (
          <div className="h-32 text-center text-muted-foreground italic text-sm flex items-center justify-center">
            No student records found.
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="h-32 text-center text-muted-foreground italic text-sm flex items-center justify-center">
            No students match &quot;{query}&quot;.
          </div>
        ) : (
          studentsByLevel.map((group) => {
            const isOpen = openLevels.has(group.level);
            const isUnassigned = group.level === "Unassigned";
            const count = group.students.length;

            return (
              <Collapsible
                key={group.level}
                open={isOpen}
                onOpenChange={(open) => toggleLevel(group.level, open)}
              >
                <CollapsibleTrigger
                  className={`px-4 py-3 w-full text-left hover:bg-muted/50 ${
                    isUnassigned ? "bg-amber-50" : "bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      } text-muted-foreground`}
                    />
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                        isUnassigned ? "bg-amber-100" : "bg-primary/10"
                      }`}
                    >
                      <Users
                        className={`h-4 w-4 ${
                          isUnassigned ? "text-amber-600" : "text-primary"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-bold text-sm truncate ${
                          isUnassigned ? "text-amber-900" : ""
                        }`}
                      >
                        {isUnassigned ? "Unassigned" : group.level}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {count} student{count !== 1 ? "s" : ""}
                        {!isUnassigned && " across all arms"}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-muted/50 text-[10px] font-bold uppercase"
                    >
                      {count}
                    </Badge>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="p-0">
                  <Table className="w-full table-fixed min-w-[900px]">
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[130px] px-4 py-3 text-[10px] font-bold uppercase tracking-widest">
                          ID
                        </TableHead>
                        <TableHead className="w-[240px] px-4 py-3 text-[10px] font-bold uppercase tracking-widest">
                          Student
                        </TableHead>
                        <TableHead className="w-[90px] px-4 py-3 text-[10px] font-bold uppercase tracking-widest">
                          Arm
                        </TableHead>
                        <TableHead className="w-[100px] px-4 py-3 text-[10px] font-bold uppercase tracking-widest">
                          Gender
                        </TableHead>
                        <TableHead className="w-[110px] px-4 py-3 text-[10px] font-bold uppercase tracking-widest">
                          DOB
                        </TableHead>
                        <TableHead className="w-[170px] px-4 py-3 text-[10px] font-bold uppercase tracking-widest">
                          Guardian
                        </TableHead>
                        <TableHead className="w-[110px] px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.students.map((student) => (
                        <TableRow
                          key={student.id}
                          className="hover:bg-muted/5 transition-colors"
                        >
                          <TableCell className="px-4 py-4 font-mono text-xs font-bold text-blue-600">
                            {student.admissionNo}
                          </TableCell>

                          <TableCell className="px-4 py-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <User size={14} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-sm truncate">
                                  {student.user.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {student.user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="px-4 py-4">
                            <Badge
                              variant="outline"
                              className="bg-muted/50 text-[10px] font-bold uppercase"
                            >
                              {student.class?.arm ?? "—"}
                            </Badge>
                          </TableCell>

                          <TableCell className="px-4 py-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                student.gender === "MALE"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-pink-100 text-pink-700"
                              }`}
                            >
                              {student.gender ?? "—"}
                            </span>
                          </TableCell>

                          <TableCell className="px-4 py-4 text-xs text-muted-foreground">
                            {formatDob(student.dateOfBirth)}
                          </TableCell>

                          <TableCell className="px-4 py-4">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {student.guardianName ?? "—"}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-mono">
                                {student.guardianPhone ?? "—"}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell className="px-4 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <AddStudentButton
                                mode="edit"
                                classes={classes}
                                initialData={{
                                  id: student.id,
                                  name: student.user.name,
                                  email: student.user.email,
                                  phone: student.user.phone,
                                  classId: student.classId,
                                  dateOfBirth: student.dateOfBirth,
                                  gender: student.gender ?? "MALE",
                                  guardianName: student.guardianName,
                                  guardianPhone: student.guardianPhone,
                                  address: student.address,
                                }}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                title="Delete student"
                                disabled={deletingId === student.id}
                                onClick={() => setConfirmDelete(student)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CollapsibleContent>
              </Collapsible>
            );
          })
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Delete student?</h3>
                <p className="text-xs text-muted-foreground">
                  This also removes their login account.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-md bg-muted/50 p-3">
              <p className="font-semibold text-sm">{confirmDelete.user.name}</p>
              <p className="font-mono text-[10px] text-muted-foreground">
                {confirmDelete.admissionNo} · {confirmDelete.user.email}
              </p>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(null)}
                disabled={deletingId === confirmDelete.id}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deletingId === confirmDelete.id}
              >
                {deletingId === confirmDelete.id
                  ? "Deleting..."
                  : "Delete student"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
