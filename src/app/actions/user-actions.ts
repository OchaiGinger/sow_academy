"use server";

import { db } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";

const convertToStudentSchema = z.object({
  userId: z.string().min(1),
  classId: z.string().min(1, "Please select a class"),
  dateOfBirth: z.coerce.date(),
  gender: z.enum(["MALE", "FEMALE"]),
  guardianName: z.string().min(2, "Guardian name is required"),
  guardianPhone: z.string().min(10, "Valid phone number required"),
  address: z.string().optional(),
});

export async function convertUserToStudent(rawInput: unknown) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return { success: false, error: "Unauthorized." };
  }

  const result = convertToStudentSchema.safeParse(rawInput);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const { userId, classId, dateOfBirth, gender, guardianName, guardianPhone, address } = result.data;

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true, teacherProfile: true },
    });

    if (!user) return { success: false, error: "User not found." };
    if (user.studentProfile) return { success: false, error: "User already has a student profile." };
    if (user.teacherProfile) return { success: false, error: "User already has a teacher profile." };

    const year = new Date().getFullYear().toString().slice(-2);
    const last = await db.student.findFirst({
      orderBy: { admissionNo: "desc" },
      select: { admissionNo: true },
    });
    let seq = Number(last?.admissionNo?.split("/").pop() ?? "0") + 1;
    let admissionNo = `SOWA/ST/${year}/${seq.toString().padStart(3, "0")}`;
    while (await db.student.findUnique({ where: { admissionNo } })) {
      seq++;
      admissionNo = `SOWA/ST/${year}/${seq.toString().padStart(3, "0")}`;
    }

    const hashed = await hashPassword(admissionNo);

    await db.$transaction([
      db.user.update({
        where: { id: userId },
        data: { role: "STUDENT" },
      }),
      db.student.create({
        data: {
          userId,
          admissionNo,
          classId,
          dateOfBirth,
          gender,
          guardianName,
          guardianPhone,
          address: address || null,
        },
      }),
      db.account.updateMany({
        where: { userId, providerId: "credential" },
        data: { password: hashed, accountId: user.email },
      }),
    ]);

    revalidatePath("/admin/users");
    revalidatePath("/admin/students");
    return { success: true, admissionNo };
  } catch (error) {
    console.error("CONVERT_USER_TO_STUDENT_ERROR:", error);
    return { success: false, error: "Failed to convert user to student." };
  }
}

export async function deleteUnlinkedUser(userId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return { success: false, error: "Unauthorized." };
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true, teacherProfile: true },
    });

    if (!user) return { success: true };
    if (user.studentProfile || user.teacherProfile) {
      return { success: false, error: "User is linked to a student or teacher profile." };
    }
    if (user.role === "SUPER_ADMIN") {
      return { success: false, error: "Cannot delete super admin." };
    }

    await db.user.delete({ where: { id: userId } });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("DELETE_UNLINKED_USER_ERROR:", error);
    return { success: false, error: "Failed to delete user." };
  }
}
