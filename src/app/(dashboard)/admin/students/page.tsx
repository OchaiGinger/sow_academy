import { db } from "@/lib/prisma";
import { AddStudentButton } from "./_components/add-student-button";
import { StudentList, type AdminStudent } from "./_components/student-list";
import { GraduationCap, Users, BookOpen } from "lucide-react";

export default async function StudentsAdminPage() {
  const [students, classes] = await Promise.all([
    db.student.findMany({
      include: { user: true, class: true },
      orderBy: { user: { name: "asc" } },
    }) as Promise<AdminStudent[]>,
    db.class.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalClasses = new Set(
    students.map((s: AdminStudent) => s.classId).filter(Boolean),
  ).size;

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

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <StudentList students={students} classes={classes} />
      </div>

      <p className="text-xs text-muted-foreground text-right">
        Total:
        <span className="font-bold text-foreground">{students.length}</span>
        recorded students
      </p>
    </div>
  );
}
