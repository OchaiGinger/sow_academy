"use server";

import { db } from "@/lib/prisma";
import { studentSchema } from "@/lib/zodSchemas";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function createStudent(rawInput: unknown) {
  const result = studentSchema.safeParse(rawInput);
  if (!result.success)
    return { success: false, error: result.error.issues[0].message };

  const {
    name,
    email,
    phone,
    classId,
    dateOfBirth,
    gender,
    guardianName,
    guardianPhone,
    address,
  } = result.data;

  try {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return { success: false, error: "Email already exists." };

    const count = await db.student.count();
    const year = new Date().getFullYear().toString().slice(-2);
    const admissionNo = `SOWA/ST/${year}/${(count + 1).toString().padStart(3, "0")}`;

    const user = await auth.api.signUpEmail({
      headers: await headers(),
      body: {
        email,
        password: admissionNo,
        name,
      },
    });

    if (!user) throw new Error("Failed to create auth user");

    await db.$transaction([
      db.user.update({
        where: { id: user.user.id },
        data: { role: "STUDENT", phone },
      }),
      db.student.create({
        data: {
          userId: user.user.id,
          admissionNo,
          classId,
          dateOfBirth,
          gender,
          guardianName,
          guardianPhone,
          address,
        },
      }),
    ]);

    revalidatePath("/admin/students");
    return { success: true, admissionNo };
  } catch (error: unknown) {
    console.error("CREATE_STUDENT_ERROR:", error);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    )
      return { success: false, error: "Email already exists." };
    return { success: false, error: "Failed to register student." };
  }
}

export async function deleteStudent(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "ADMIN")
    return { success: false, error: "Only an admin can delete students." };

  try {
    const student = await db.student.findUnique({
      where: { id },
      select: { userId: true, admissionNo: true },
    });

    if (!student) return { success: true };

    // Removing only the Student row would leave the User (and its credential
    // Account) behind, which permanently blocks re-using that email address.
    await db.user.delete({ where: { id: student.userId } });

    revalidatePath("/admin/students");
    return { success: true, admissionNo: student.admissionNo };
  } catch (error) {
    console.error("DELETE_STUDENT_ERROR:", error);
    return { success: false, error: "Failed to delete student." };
  }
}

export async function updateStudent(studentId: string, rawInput: unknown) {
  const result = studentSchema.safeParse(rawInput);
  if (!result.success)
    return { success: false, error: result.error.issues[0].message };

  const {
    name,
    email,
    phone,
    classId,
    dateOfBirth,
    gender,
    guardianName,
    guardianPhone,
    address,
  } = result.data;

  try {
    const currentStudent = await db.student.findUnique({
      where: { id: studentId },
      select: { userId: true },
    });

    if (!currentStudent)
      return { success: false, error: "Student profile not found." };

    await db.$transaction([
      db.user.update({
        where: { id: currentStudent.userId },
        data: { name, email, phone },
      }),
      db.student.update({
        where: { id: studentId },
        data: {
          classId,
          dateOfBirth,
          gender,
          guardianName,
          guardianPhone,
          address,
        },
      }),
    ]);

    revalidatePath("/admin/students");
    return { success: true, message: "Student record updated successfully." };
  } catch (error: unknown) {
    console.error("UPDATE_STUDENT_ERROR:", error);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    )
      return { success: false, error: "Email is already in use." };
    return { success: false, error: "Failed to update student records." };
  }
}
