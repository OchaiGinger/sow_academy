import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    const school = await prisma.school.findFirst({
      select: { id: true },
    });
    return NextResponse.json({ setupComplete: !!school });
  } catch (error) {
    return NextResponse.json({ setupComplete: false }, { status: 500 });
  }
}
