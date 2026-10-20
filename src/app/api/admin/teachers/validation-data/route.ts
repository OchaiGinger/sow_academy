import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const teachers = await db.teacher.findMany({
      select: {
        id: true,
        staffId: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        classSubjects: {
          select: {
            class: { select: { name: true } },
            subject: { select: { name: true } },
          },
        },
        formMasters: {
          select: {
            class: { select: { name: true } },
          },
        },
      },
      orderBy: { user: { name: "asc" } },
    });

    return NextResponse.json(teachers);
  } catch (error) {
    console.error("Error fetching teachers for validation:", error);
    return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 });
  }
}