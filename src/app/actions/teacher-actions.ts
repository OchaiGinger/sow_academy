"use server";

import { db } from "@/lib/prisma";
import { teacherSchema } from "@/lib/zodSchemas";
import { revalidatePath } from "next/cache";
import { hashPassword } from "better-auth/crypto";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function createTeacher(rawInput: unknown) {
  const result = teacherSchema.safeParse(rawInput);
  if (!result.success)
    return { success: false, error: result.error.issues[0].message };

  const { name, email, phone, password, classSubjectIds } = result.data;

  try {
    // Run existence check + hash in parallel
    const [existingUser, hashedPassword] = await Promise.all([
      db.user.findUnique({ where: { email }, select: { id: true } }),
      hashPassword(password),
    ]);

    if (existingUser)
      return {
        success: false,
        error: "A user with this email already exists.",
      };

    await db.$transaction(
      async (tx) => {
        const [count, user] = await Promise.all([
          tx.teacher.count(),
          tx.user.create({
            data: {
              name,
              email,
              phone: phone || null,
              role: "TEACHER",
              accounts: {
                create: {
                  providerId: "credential",
                  accountId: email,
                  password: hashedPassword,
                },
              },
            },
            select: { id: true },
          }),
        ]);

        const staffId = `STF/${new Date().getFullYear()}/${(count + 1).toString().padStart(3, "0")}`;

        await tx.teacher.create({
          data: {
            userId: user.id,
            staffId,
            classSubjects: { connect: classSubjectIds.map((id) => ({ id })) },
          },
          select: { id: true },
        });
      },
      { timeout: 10000 },
    );

    revalidatePath("/admin/teachers");
    return { success: true };
  } catch (error: any) {
    console.error("CREATE_TEACHER_ERROR:", error);
    if (error.code === "P2002")
      return { success: false, error: "Email or Staff ID already exists." };
    return { success: false, error: error.message || "Unexpected error." };
  }
}

export async function deleteTeacher(id: string) {
  try {
    await db.teacher.delete({ where: { id } });
    revalidatePath("/admin/teachers");
    return { success: true };
  } catch (error) {
    console.error("DELETE_ERROR:", error);
    return { success: false, error: "Failed to delete teacher." };
  }
}

// app/actions/teacher-actions.ts
export async function togglePrincipalRole(
  userId: string,
  shouldBePrincipal: boolean,
) {
  try {
    await db.user.update({
      where: { id: userId },
      data: { role: shouldBePrincipal ? "PRINCIPAL" : "TEACHER" },
    });
    revalidatePath("/admin/teachers");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update role." };
  }
}

export async function principalBulkStamp(classId: string, termId: string) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.user.role !== "PRINCIPAL") {
    return {
      success: false,
      error: "Only the Principal can apply the official seal.",
    };
  }

  await db.termResult.updateMany({
    where: {
      student: {
        classId,
      },
      termId,
      isApproved: true,
    },
    data: {
      isStamped: true,
      stampedBy: session.user.id,
      stampedAt: new Date(),
    },
  });

  revalidatePath("/principal/approvals");
  return { success: true };
}
