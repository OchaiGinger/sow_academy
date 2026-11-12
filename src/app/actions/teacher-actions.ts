"use server";

import { db } from "@/lib/prisma";
import { teacherSchema, updateTeacherSchema } from "@/lib/zodSchemas";
import { revalidatePath } from "next/cache";
import { hashPassword } from "better-auth/crypto";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sendMail, splitName } from "@/lib/novu";

/**
 * A class-subject may only be allocated if it is unassigned, or already held by
 * the teacher being edited. The picker only offers those, but the check is
 * repeated here so a stale tab or crafted request cannot take a subject that
 * belongs to someone else.
 */
async function assertSubjectsClaimable(
  classSubjectIds: string[],
  teacherId?: string,
) {
  if (classSubjectIds.length === 0) return { ok: true as const };

  const claimed = await db.classSubject.findMany({
    where: { id: { in: classSubjectIds } },
    select: { id: true, teacherId: true },
  });

  if (claimed.length !== classSubjectIds.length)
    return { ok: false as const, error: "One or more subjects no longer exist." };

  const takenByOther = claimed.filter(
    (cs) => cs.teacherId !== null && cs.teacherId !== teacherId,
  );

  if (takenByOther.length > 0)
    return {
      ok: false as const,
      error: "One or more of those subjects are already assigned to another teacher.",
    };

  return { ok: true as const };
}

async function nextStaffId(tx: Pick<typeof db, "teacher">) {
  const year = new Date().getFullYear().toString().slice(-2);
  const prefix = `SOWA/STF/${year}/`;
  const existing = await tx.teacher.findMany({
    where: { staffId: { startsWith: prefix } },
    select: { staffId: true },
  });
  const used = new Set(existing.map(({ staffId }) => staffId));

  let sequence = 1;
  let staffId = `${prefix}${sequence.toString().padStart(3, "0")}`;
  while (used.has(staffId)) {
    sequence++;
    staffId = `${prefix}${sequence.toString().padStart(3, "0")}`;
  }
  return staffId;
}

export async function createTeacher(rawInput: unknown) {
  const result = teacherSchema.safeParse(rawInput);
  if (!result.success)
    return { success: false, error: result.error.issues[0].message };

  const { name, email, phone, image, password, classSubjectIds } = result.data;

  try {
    const existingUser = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        role: true,
        studentProfile: { select: { id: true } },
        teacherProfile: { select: { id: true } },
      },
    });

    if (existingUser?.teacherProfile)
      return {
        success: false,
        error: "A user with this email already exists.",
      };

    if (
      existingUser &&
      (existingUser.studentProfile ||
        !["TEACHER", "PRINCIPAL"].includes(existingUser.role))
    )
      return {
        success: false,
        error: "This email belongs to another account type and cannot be registered as a teacher.",
      };

    const claimable = await assertSubjectsClaimable(classSubjectIds);
    if (!claimable.ok) return { success: false, error: claimable.error };

    const hashedPassword = await hashPassword(password);
    const { firstName, lastName } = splitName(name);

    const created = await db.$transaction(
      async (tx) => {
        let userId: string;

        if (existingUser) {
          userId = existingUser.id;
          await tx.user.update({
            where: { id: userId },
            data: { name, phone: phone || null, image: image || null },
          });

          const credential = await tx.account.updateMany({
            where: { userId, providerId: "credential" },
            data: { password: hashedPassword, accountId: email },
          });

          if (credential.count === 0) {
            await tx.account.create({
              data: {
                userId,
                providerId: "credential",
                accountId: email,
                password: hashedPassword,
              },
            });
          }
        } else {
          const user = await tx.user.create({
            data: {
              name,
              email,
              phone: phone || null,
              image: image || null,
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
          });
          userId = user.id;
        }

        const staffId = await nextStaffId(tx);

        await tx.teacher.create({
          data: {
            userId,
            staffId,
            classSubjects: { connect: classSubjectIds.map((id) => ({ id })) },
          },
          select: { id: true },
        });

        return { userId, staffId };
      },
      { timeout: 10000 },
    );

    // Fired after commit so the teacher is never emailed about an account
    // that failed to persist. A mail failure must not undo the signup.
    const mail = await sendMail(
      "teacher-welcome-email",
      {
        subscriberId: created.userId,
        firstName,
        lastName,
        email,
      },
      {
        title: "Welcome to Seat of Wisdom Academy",
        message: `Your staff profile has been created. Your Staff ID is ${created.staffId}. Sign in with the email ${email} to begin.`,
        actionUrl: `${
          process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL
        }/admin/teachers`,
      },
    );

    revalidatePath("/admin/teachers");
    revalidatePath("/admin/teacher-id-cards");
    return { success: true, emailSent: mail.success };
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

  const { name, email, phone, image, password, classSubjectIds } = result.data;

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

    const claimable = await assertSubjectsClaimable(classSubjectIds, teacherId);
    if (!claimable.ok) return { success: false, error: claimable.error };

    // Changing the email must not leave the old credential account pointing at
    // a stale accountId, so it has to move in lockstep with the User row.
    const hashedPassword = password ? await hashPassword(password) : null;

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existingTeacher.userId },
        data: { name, email, phone: phone || null, image: image || null },
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
    revalidatePath("/admin/teacher-id-cards");
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
