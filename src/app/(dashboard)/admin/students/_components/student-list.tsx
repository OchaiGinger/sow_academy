"use client";

import { useState, useMemo } from "react";
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
import { Search, User, ChevronDown, ChevronRight, Users } from "lucide-react";
import { AddStudentButton } from "./add-student-button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

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

export function StudentList({ students, classes }: Props) {
  const [query, setQuery] = useState("");
  const [openClasses, setOpenClasses] = useState<Set<string>>(new Set(classes.map(c => c.id)));

  const normalizedQuery = query.trim().toLowerCase();
  const filteredStudents = useMemo(() => {
    if (!normalizedQuery) return students;
    return students.filter((s) =>
      [s.user.name, s.user.email, s.admissionNo, s.guardianName ?? ""].some(
        (field) => field.toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [students, normalizedQuery]);

  // Group students by class
  const studentsByClass = useMemo(() => {
    const grouped: Record<string, AdminStudent[]> = {};
    filteredStudents.forEach((student) => {
      const classId = student.classId || "unassigned";
      if (!grouped[classId]) grouped[classId] = [];
      grouped[classId].push(student);
    });
    return grouped;
  }, [filteredStudents]);

  // Sort classes by level and arm
  const sortedClasses = useMemo(() => {
    return [...classes].sort((a, b) => {
      const levelOrder = { "JSS1": 1, "JSS2": 2, "JSS3": 3, "SS1": 4, "SS2": 5, "SS3": 6 };
      const levelA = levelOrder[a.level as keyof typeof levelOrder] || 99;
      const levelB = levelOrder[b.level as keyof typeof levelOrder] || 99;
      if (levelA !== levelB) return levelA - levelB;
      return a.arm.localeCompare(b.arm);
    });
  }, [classes]);

  const toggleClass = (classId: string) => {
    setOpenClasses(prev => {
      const next = new Set(prev);
      if (next.has(classId)) next.delete(classId);
      else next.add(classId);
      return next;
    });
  };

  const toggleAllClasses = (expand: boolean) => {
    if (expand) {
      setOpenClasses(new Set(classes.map(c => c.id)));
    } else {
      setOpenClasses(new Set());
    }
  };

  const unassignedStudents = studentsByClass["unassigned"] || [];
  const hasUnassigned = unassignedStudents.length > 0;

  return (
    <>
      <div className="border-b bg-card px-4 py-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email or admission no..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="w-full table-fixed min-w-[800px]">
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[120px] px-4 py-3 text-[10px] font-bold uppercase tracking-widest">
                ID
              </TableHead>
              <TableHead className="w-[250px] px-4 py-3 text-[10px] font-bold uppercase tracking-widest">
                Student
              </TableHead>
              <TableHead className="w-[120px] px-4 py-3 text-[10px] font-bold uppercase tracking-widest">
                Class
              </TableHead>
              <TableHead className="w-[100px] px-4 py-3 text-[10px] font-bold uppercase tracking-widest">
                Gender
              </TableHead>
              <TableHead className="w-[180px] px-4 py-3 text-[10px] font-bold uppercase tracking-widest">
                Guardian
              </TableHead>
              <TableHead className="w-[100px] px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground italic text-sm"
                >
                  No student records found.
                </TableCell>
              </TableRow>
            ) : filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground italic text-sm"
                >
                  No students match &quot;{query}&quot;.
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => (
                <TableRow
                  key={student.id}
                  className="hover:bg-muted/5 transition-colors"
                >
                  <TableCell className="px-4 py-4 font-mono text-xs font-bold text-blue-600">
                    {student.admissionNo}
                  </TableCell>

                  <TableCell className="px-4 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
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
                      {student.class?.name ?? "N/A"}
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
                      {student.gender}
                    </span>
                  </TableCell>

                  <TableCell className="px-4 py-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {student.guardianName}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {student.guardianPhone}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="px-4 py-4 text-right">
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
