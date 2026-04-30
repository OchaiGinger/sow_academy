import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    name,
    email,
    admissionNo,
    classId,
    dateOfBirth,
    gender,
    guardianName,
    guardianPhone,
    address,
  } = body;

  try {
    // Create the user account first, then the student profile
    const student = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          role: "STUDENT",
        },
      });

      return tx.student.create({
        data: {
          userId: user.id,
          admissionNo,
          classId,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          gender: gender || null,
          guardianName: guardianName || null,
          guardianPhone: guardianPhone || null,
          address: address || null,
        },
      });
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          error: "A student with this email or admission number already exists",
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 },
    );
  }
}
