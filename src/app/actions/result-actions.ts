"use server";

import { db } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function getStudentReportData(studentId: string) {
  const currentTerm = await db.term.findFirst({ where: { isCurrent: true } });
  if (!currentTerm) return null;

  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { name: true } },
      scores: {
        where: { termId: currentTerm.id },
        include: { classSubject: { include: { subject: true } } },
      },
    },
  });

  return {
    student,
    term: currentTerm.name,
  };
}

export async function verifyResultCode(
  termId: string,
  classId: string,
  enteredCode: string,
) {
  try {
    // 1. Verify code against the database
    const validCode = await db.termCardPassword.findFirst({
      where: {
        termId,
        classId,
        password: enteredCode,
      },
    });

    if (!validCode) {
      return { success: false, error: "Invalid or incorrect clearance code." };
    }

    // 2. Set the verification cookie
    // We use path: "/" so the cookie is visible to /student/result/[id]
    const cookieStore = await cookies();
    cookieStore.set(`result_verified_${termId}`, "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60, // Valid for 1 hour
      sameSite: "lax",
    });

    return { success: true };
  } catch (error) {
    console.error("[verifyResultCode]", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function bulkStampResults(classId: string, termId: string) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return { success: false, error: "Unauthorized.", count: 0 };
  }

  if (session.user.role !== "PRINCIPAL") {
    return {
      success: false,
      error: "Unauthorized: Only the Principal can apply the school seal.",
      count: 0,
    };
  }

  try {
    const result = await db.termResult.updateMany({
      where: {
        termId,
        isApproved: true,
        isStamped: false,
        student: { classId }, // ✅ classId lives on Student, not TermResult
      },
      data: {
        isStamped: true,
        stampedBy: session.user.id,
        stampedAt: new Date(),
      },
    });

    revalidatePath("/principal/stamping");
    return { success: true, count: result.count };
  } catch (error) {
    console.error("[bulkStampResults]", error);
    return {
      success: false,
      error: "Failed to apply official stamp.",
      count: 0,
    };
  }
}
