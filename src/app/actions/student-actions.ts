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
    // 1. Check if email already exists
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return { success: false, error: "Email already exists." };

    // 2. Generate Admission Number
    const count = await db.student.count();
    const year = new Date().getFullYear();
    const admissionNo = `ADM/${year}/${(count + 1).toString().padStart(3, "0")}`;

    // 3. Create User via Better Auth (only accepts built-in fields)
    const user = await auth.api.signUpEmail({
      headers: await headers(),
      body: {
        email,
        password: admissionNo, // Better Auth hashes this with scrypt
        name,
      },
    });

    if (!user) throw new Error("Failed to create auth user");

    // 4. Set role + phone, then create Student profile atomically
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
  } catch (error: any) {
    console.error("CREATE_STUDENT_ERROR:", error);
    if (error.code === "P2002")
      return { success: false, error: "Email already exists." };
    return { success: false, error: "Failed to register student." };
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
  } catch (error: any) {
    console.error("UPDATE_STUDENT_ERROR:", error);
    if (error.code === "P2002")
      return { success: false, error: "Email is already in use." };
    return { success: false, error: "Failed to update student records." };
  }
}
