"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TermName } from "@prisma/client";

// ── Helpers ──────────────────────────────────────────────────────────────────

function handlePrismaError(error: unknown, context: string): never {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : undefined;
  const message = error instanceof Error ? error.message : undefined;

  switch (code) {
    case "P2002":
      throw new Error(`A ${context} with that name already exists.`);
    case "P2025":
      throw new Error(
        `${context} not found — it may have already been deleted.`,
      );
    case "P2003":
      throw new Error(
        `Cannot delete this ${context} because it has related records.`,
      );
    default:
      throw new Error(
        message ?? `Failed to ${context.toLowerCase()}. Please try again.`,
      );
  }
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export async function getSessions() {
  try {
    return await db.academicSession.findMany({
      orderBy: { name: "desc" },
      include: { terms: { orderBy: { name: "asc" } } },
    });
  } catch (e: unknown) {
    throw new Error(
      e instanceof Error ? e.message : "Failed to load sessions.",
    );
  }
}

export async function createSession(name: string) {
  try {
    await db.academicSession.create({
      data: { name },
      select: { id: true },
    });
    revalidatePath("/admin/sessions");
  } catch (e: unknown) {
    handlePrismaError(e, "session");
  }
}

export async function updateSession(id: string, name: string) {
  try {
    await db.academicSession.update({
      where: { id },
      data: { name },
      select: { id: true },
    });
    revalidatePath("/admin/sessions");
  } catch (e: unknown) {
    handlePrismaError(e, "session");
  }
}

export async function deleteSession(id: string) {
  try {
    await db.academicSession.delete({ where: { id } });
    revalidatePath("/admin/sessions");
  } catch (e: unknown) {
    handlePrismaError(e, "session");
  }
}

export async function setCurrentSession(id: string) {
  try {
    await db.$transaction([
      db.academicSession.updateMany({ data: { isCurrent: false } }),
      db.academicSession.update({ where: { id }, data: { isCurrent: true } }),
    ]);
    revalidatePath("/admin/sessions");
  } catch (e: unknown) {
    handlePrismaError(e, "session");
  }
}

// ── Terms ─────────────────────────────────────────────────────────────────────

export interface TermFormData {
  name: TermName;
  startDate?: string;
  endDate?: string;
  nextTermDate?: string;
}

export async function createTerm(sessionId: string, data: TermFormData) {
  try {
    await db.term.create({
      data: {
        sessionId,
        name: data.name,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        nextTermDate: data.nextTermDate
          ? new Date(data.nextTermDate)
          : undefined,
      },
      select: { id: true },
    });
    revalidatePath("/admin/sessions");
  } catch (e: unknown) {
    handlePrismaError(e, "term");
  }
}

export async function updateTerm(id: string, data: TermFormData) {
  try {
    await db.term.update({
      where: { id },
      data: {
        name: data.name,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        nextTermDate: data.nextTermDate ? new Date(data.nextTermDate) : null,
      },
      select: { id: true },
    });
    revalidatePath("/admin/sessions");
  } catch (e: unknown) {
    handlePrismaError(e, "term");
  }
}

export async function deleteTerm(id: string) {
  try {
    await db.term.delete({ where: { id } });
    revalidatePath("/admin/sessions");
  } catch (e: unknown) {
    handlePrismaError(e, "term");
  }
}

export async function setCurrentTerm(id: string) {
  try {
    await db.$transaction([
      db.term.updateMany({ data: { isCurrent: false } }),
      db.term.update({ where: { id }, data: { isCurrent: true } }),
    ]);
    revalidatePath("/admin/sessions");
  } catch (e: unknown) {
    handlePrismaError(e, "term");
  }
}
