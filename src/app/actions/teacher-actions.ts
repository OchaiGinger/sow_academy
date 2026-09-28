"use server";

import { db } from "@/lib/prisma";
import { teacherSchema, updateTeacherSchema } from "@/lib/zodSchemas";
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

        const staffId = `SOWA/STF/${new Date().getFullYear().toString().slice(-2)}/${(count + 1).toString().padStart(3, "0")}`;

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
  } catch (error: unknown) {
    console.error("CREATE_TEACHER_ERROR:", error);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    )
      return { success: false, error: "Email or Staff ID already exists." };
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error.",
    };
  }
}

export async function updateTeacher(teacherId: string, rawInput: unknown) {
  const result = updateTeacherSchema.safeParse(rawInput);
  if (!result.success)
    return { success: false, error: result.error.issues[0].message };

  const { name, email, phone, password, classSubjectIds } = result.data;

  try {
    const existingTeacher = await db.teacher.findUnique({
      where: { id: teacherId },
      select: { id: true, userId: true },
    });

    if (!existingTeacher)
      return { success: false, error: "Teacher profile not found." };

    // A different user must not already own this email
    const emailOwner = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (emailOwner && emailOwner.id !== existingTeacher.userId)
      return { success: false, error: "A user with this email already exists." };

    // Changing the email must not leave the old credential account pointing at
    // a stale accountId, so it has to move in lockstep with the User row.
    const hashedPassword = password ? await hashPassword(password) : null;

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existingTeacher.userId },
        data: { name, email, phone: phone || null },
      });

      if (hashedPassword) {
        await tx.account.updateMany({
          where: { userId: existingTeacher.userId, providerId: "credential" },
          data: { password: hashedPassword, accountId: email },
        });
      } else {
        await tx.account.updateMany({
          where: { userId: existingTeacher.userId, providerId: "credential" },
          data: { accountId: email },
        });
      }

      // set replaces the whole allocation, so unchecking frees the subject
      await tx.teacher.update({
        where: { id: teacherId },
        data: { classSubjects: { set: classSubjectIds.map((id) => ({ id })) } },
      });
    });

    revalidatePath("/admin/teachers");
    return { success: true };
  } catch (error: unknown) {
    console.error("UPDATE_TEACHER_ERROR:", error);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    )
      return { success: false, error: "Email or Staff ID already exists." };
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error.",
    };
  }
}

export async function deleteTeacher(id: string) {
  try {
    // Deleting only the Teacher row leaves the linked User (and its credential
    // Account) behind, which permanently blocks re-using that email address.
    // Removing the User cascades to Teacher, Account and Session.
    const teacher = await db.teacher.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!teacher) return { success: true };

    await db.user.delete({ where: { id: teacher.userId } });

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
