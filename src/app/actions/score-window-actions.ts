"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ScoreComponent } from "@prisma/client";

const ALL_COMPONENTS: ScoreComponent[] = [
  "ASSIGNMENT1",
  "ASSIGNMENT2",
  "TEST1",
  "TEST2",
  "EXAM",
];

export async function getOrCreateScoreWindows(termId: string) {
  await db.scoreWindow.createMany({
    data: ALL_COMPONENTS.map((component) => ({
      termId,
      component,
      isOpen: false,
    })),
    skipDuplicates: true,
  });

  return db.scoreWindow.findMany({
    where: { termId },
    orderBy: { component: "asc" },
  });
}

export async function toggleScoreWindow(
  termId: string,
  component: ScoreComponent,
  isOpen: boolean,
  opensAt?: string | null,
  closesAt?: string | null,
) {
  await db.scoreWindow.upsert({
    where: { termId_component: { termId, component } },
    update: {
      isOpen,
      opensAt: opensAt ? new Date(opensAt) : null,
      closesAt: closesAt ? new Date(closesAt) : null,
    },
    create: {
      termId,
      component,
      isOpen,
      opensAt: opensAt ? new Date(opensAt) : null,
      closesAt: closesAt ? new Date(closesAt) : null,
    },
    select: { id: true },
  });

  revalidatePath("/admin/sessions");
  revalidatePath("/teacher/scores");
}

// Combined into ONE query instead of two sequential round trips
export async function getOpenWindowsForCurrentTerm() {
  const windows = await db.scoreWindow.findMany({
    where: {
      term: { isCurrent: true },
      isOpen: true,
    },
    select: { component: true },
  });

  return windows;
}
