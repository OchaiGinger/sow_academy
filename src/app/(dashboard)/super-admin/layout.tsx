import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const role = session.user.role as string;
  if (role !== "SUPER_ADMIN") redirect("/admin");

  return (
    <DashboardShell role="SUPER_ADMIN" isFormMaster={false} isPrincipal={false} userId={session.user.id}>
      {children}
    </DashboardShell>
  );
}
