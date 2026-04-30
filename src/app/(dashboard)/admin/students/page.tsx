import { db } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { AddStudentButton } from "./_components/add-student-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GraduationCap, Users, BookOpen, User } from "lucide-react";

export default async function StudentsAdminPage() {
  const [students, classes] = await Promise.all([
    db.student.findMany({
      include: { user: true, class: true },
      orderBy: { user: { name: "asc" } },
    }),
    db.class.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalClasses = new Set(students.map((s) => s.classId).filter(Boolean))
    .size;

  return (
    <div className="max-w-7xl mx-auto py-4 px-4 md:py-8 md:px-6 space-y-8 overflow-x-hidden">
      {/* --- STATS BAR (Responsive Grid) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total Students",
            value: students.length,
            icon: Users,
            color: "text-blue-600 bg-blue-50",
          },
          {
            label: "Active Classes",
            value: totalClasses,
            icon: BookOpen,
            color: "text-emerald-600 bg-emerald-50",
          },
          {
            label: "Academic Year",
            value: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
            icon: GraduationCap,
            color: "text-amber-600 bg-amber-50",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-xl border bg-card p-4 flex items-center gap-4 shadow-sm"
          >
            <div className={`p-3 rounded-lg ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <p className="text-xl font-black truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* --- HEADER --- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b pb-6">
        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight md:text-4xl">
            Student Directory
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage student records, admissions, and academic profiles.
          </p>
        </div>
        <div className="w-full sm:w-auto shrink-0">
          <AddStudentButton classes={classes} />
        </div>
      </div>

      {/* --- TABLE CONTAINER (Responsive Fix) --- */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {/* Internal scroll for small screens */}
          <Table className="w-full table-fixed min-w-[800px]">
            {/* Prevents column collapse */}
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
              {students.length > 0 ? (
                students.map((student) => (
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
                          gender: student.gender,
                          guardianName: student.guardianName,
                          guardianPhone: student.guardianPhone,
                          address: student.address,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-muted-foreground italic text-sm"
                  >
                    No student records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-right">
        Total:
        <span className="font-bold text-foreground">{students.length}</span>
        recorded students
      </p>
    </div>
  );
}
