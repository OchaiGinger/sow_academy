"use server";

import { db } from "@/lib/prisma";

export async function getCurrentTermInfo() {
  try {
    const term = await db.term.findFirst({
      where: { isCurrent: true },
      include: { session: true },
    });

    if (!term) return "No Active Term";

    // Format: "First Term 2024/2025"
    const termName =
      term.name.charAt(0).toUpperCase() + term.name.slice(1).toLowerCase();
    return `${termName} Term ${term.session.name}`;
  } catch (error) {
    return "Session Error";
  }
}

// Optional: Helper to fetch subject name if the ID is in the URL
export async function getSubjectName(subjectId: string) {
  const subject = await db.subject.findUnique({
    where: { id: subjectId },
    select: { name: true },
  });
  return subject?.name || null;
}
