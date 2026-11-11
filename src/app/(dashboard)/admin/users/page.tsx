import { db } from "@/lib/prisma";
import { UsersClient } from "./_components/users-client";

export default async function AdminUsersPage() {
  const [users, classes] = await Promise.all([
    db.user.findMany({
      where: {
        studentProfile: null,
        teacherProfile: null,
        role: { notIn: ["SUPER_ADMIN"] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.class.findMany({
      select: { id: true, name: true, level: true, arm: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto py-4 px-4 md:py-8 md:px-6 space-y-6">
      <div className="border-b pb-6">
        <h1 className="text-2xl font-extrabold tracking-tight md:text-4xl">
          Unlinked Users
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Users in the system without a student or teacher profile. Convert them to students or remove them.
        </p>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <UsersClient users={users} classes={classes} />
      </div>

      <p className="text-xs text-muted-foreground text-right">
        Total: <span className="font-bold text-foreground">{users.length}</span> unlinked users
      </p>
    </div>
  );
}
