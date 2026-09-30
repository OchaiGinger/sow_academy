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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative max-w-sm sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email or admission no..."
              className="h-8 pl-8 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => toggleAllClasses(true)}
            >
              <ChevronDown className="h-3 w-3 mr-1" /> Expand All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => toggleAllClasses(false)}
            >
              <ChevronRight className="h-3 w-3 mr-1" /> Collapse All
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
          <>
            {/* Render each class as a collapsible section */}
            {sortedClasses.map((cls) => {
              const classStudents = studentsByClass[cls.id] || [];
              const isOpen = openClasses.has(cls.id);
              const studentCount = classStudents.length;

              return (
                <Collapsible key={cls.id} open={isOpen} onOpenChange={(open) => {
                  if (open) setOpenClasses(prev => new Set(prev).add(cls.id));
                  else setOpenClasses(prev => { const next = new Set(prev); next.delete(cls.id); return next; });
                }}>
                  <CollapsibleTrigger className="bg-muted/30 hover:bg-muted/50 px-4 py-3 w-full text-left">
                    <div className="flex items-center gap-3">
                      <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''} text-muted-foreground`} />
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{cls.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Level: {cls.level} | Arm: {cls.arm} | {studentCount} student{studentCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-muted/50 text-[10px] font-bold uppercase">
                        {studentCount}
                      </Badge>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-0">
                    <Table className="w-full table-fixed min-w-[800px]">
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="w-[120px] px-4 py-3 text-[10px] font-bold uppercase tracking-widest">
                            ID
                          </TableHead>
                          <TableHead className="w-[250px] px-4 py-3 text-[10px] font-bold uppercase tracking-widest">
                            Student
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
                        {classStudents.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="h-24 text-center text-muted-foreground italic text-sm"
                            >
                              No students in this class yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          classStudents.map((student) => (
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
                  </CollapsibleContent>
                </Collapsible>
              );
            })}

            {/* Unassigned students section */}
            {hasUnassigned && (
              <Collapsible open={openClasses.has("unassigned")} onOpenChange={(open) => {
                if (open) setOpenClasses(prev => new Set(prev).add("unassigned"));
                else setOpenClasses(prev => { const next = new Set(prev); next.delete("unassigned"); return next; });
              }}>
                <CollapsibleTrigger className="bg-amber-50 hover:bg-amber-100 px-4 py-3 w-full text-left border border-amber-200">
                  <div className="flex items-center gap-3">
                    <ChevronDown className={`h-4 w-4 transition-transform ${openClasses.has("unassigned") ? 'rotate-180' : ''} text-amber-600`} />
                    <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Users className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-amber-800">Unassigned Students</p>
                      <p className="text-[10px] text-amber-600">
                        {unassignedStudents.length} student{unassignedStudents.length !== 1 ? 's' : ''} without a class
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                      {unassignedStudents.length}
                    </Badge>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="p-0">
                  <Table className="w-full table-fixed min-w-[800px]">
                    <TableHeader className="bg-amber-50/50">
                      <TableRow>
                        <TableHead className="w-[120px] px-4 py-3 text-[10px] font-bold uppercase tracking-widest">
                          ID
                        </TableHead>
                        <TableHead className="w-[250px] px-4 py-3 text-[10px] font-bold uppercase tracking-widest">
                          Student
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
                      {unassignedStudents.map((student) => (
                        <TableRow
                          key={student.id}
                          className="hover:bg-amber-50/30 transition-colors"
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
                      ))}
                    </TableBody>
                  </Table>
                </CollapsibleContent>
              </Collapsible>
            )}
          </>
        )}
      </div>
    </>
  );
}