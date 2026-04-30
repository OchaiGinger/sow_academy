// app/(dashboard)/layout.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/dashboard-shell";

// FIX: Added STUDENT here
const ALLOWED_ROLES = ["PRINCIPAL", "TEACHER", "ADMIN", "STUDENT"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const userRole = session.user.role as AllowedRole;

  // Now "STUDENT" won't trigger this redirect
  if (!ALLOWED_ROLES.includes(userRole)) redirect("/login");

  const isPrincipal = userRole === "PRINCIPAL";
  const isStudent = userRole === "STUDENT";
  const hasTeacherRole = userRole === "TEACHER" || isPrincipal;

  let isFormMaster = false;

  // Only attempt teacher lookup if they aren't a student
  if (hasTeacherRole && !isStudent) {
    try {
      const teacherRecord = await db.teacher.findUnique({
        where: { userId: session.user.id },
        select: { formMaster: { select: { id: true } } },
      });
      isFormMaster = !!teacherRecord?.formMaster;
    } catch (err) {
      console.error("[DashboardLayout] teacher lookup failed:", err);
    }
  }

  return (
    <DashboardShell
      role={userRole}
      isFormMaster={isFormMaster}
      isPrincipal={isPrincipal}
    >
      {children}
    </DashboardShell>
  );
}
