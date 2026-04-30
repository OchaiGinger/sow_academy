import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET() {
  const classes = await db.class.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return NextResponse.json(classes);
}
