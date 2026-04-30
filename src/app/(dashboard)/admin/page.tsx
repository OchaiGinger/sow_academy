import { StatsCard } from "@/components/shared/stats-card";
import { db } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [studentCount, teacherCount, classCount, recentStudents] =
    await Promise.all([
      db.student.count(),
      db.teacher.count(),
      db.class.count(),
      db.student.findMany({
        take: 5,
        orderBy: { user: { createdAt: "desc" } },
        include: { user: true, class: true },
      }),
    ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Students"
          value={studentCount}
          trend="up"
          change="+12%"
        />
        <StatsCard label="Total Teachers" value={teacherCount} />
        <StatsCard label="Active Classes" value={classCount} />
        <StatsCard label="Terms Active" value="03" accent />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-bg-surface border border-border-subtle rounded-sm">
            <div className="p-4 border-b border-border-subtle flex justify-between items-center">
              <h2 className="text-sm font-bold uppercase tracking-wider">
                Recently Admitted
              </h2>
              <span className="text-2xs text-text-tertiary">Terminal Log</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-bg-elevated text-text-secondary text-[10px] uppercase tracking-widest font-bold">
                  <tr>
                    <th className="px-6 py-3">Admission No</th>
                    <th className="px-6 py-3">Student Name</th>
                    <th className="px-6 py-3">Class</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {recentStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-bg-elevated transition-colors text-text-primary"
                    >
                      <td className="px-6 py-4 font-mono tabular-nums">
                        {student.admissionNo}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {student.user.name}
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {student.class?.name ?? "—"} {/* ← safe access */}
                      </td>
                      <td className="px-6 py-4 text-2xs text-text-tertiary">
                        {new Date(student.user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {recentStudents.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-10 text-center text-text-tertiary italic"
                      >
                        No student records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-bg-surface border border-border-subtle rounded-sm p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-6">
              Setup Checklist
            </h2>
            <div className="space-y-4">
              {[
                { label: "Define Academic Sessions", done: true },
                { label: "Create Classes & Arms", done: true },
                { label: "Add Subject Registry", done: false },
                { label: "Register Staff/Teachers", done: false },
                { label: "Admit Initial Students", done: false },
                { label: "Configure Card Passwords", done: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                      item.done
                        ? "bg-primary border-primary"
                        : "border-border-strong bg-transparent",
                    )}
                  >
                    {item.done && (
                      <div className="w-1.5 h-1.5 bg-bg-base rounded-full" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs",
                      item.done
                        ? "text-text-secondary line-through"
                        : "text-text-primary font-medium",
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");
