import { config } from "dotenv";
config({ path: ".env" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function repairOrphanTeachers() {
  const orphanUsers = await db.user.findMany({
    where: {
      role: { in: ["TEACHER", "PRINCIPAL"] },
      teacherProfile: null,
      studentProfile: null,
    },
    select: { id: true, name: true, email: true, role: true },
  });

  for (const user of orphanUsers) {
    const staffId = await db.$transaction(async (tx) => {
      // Recheck within the transaction so reruns or concurrent repairs are safe.
      const current = await tx.user.findUnique({
        where: { id: user.id },
        select: { role: true, teacherProfile: { select: { id: true } }, studentProfile: { select: { id: true } } },
      });
      if (
        !current ||
        !["TEACHER", "PRINCIPAL"].includes(current.role) ||
        current.teacherProfile ||
        current.studentProfile
      ) return null;

      const year = new Date().getFullYear().toString().slice(-2);
      const prefix = `SOWA/STF/${year}/`;
      const ids = await tx.teacher.findMany({
        where: { staffId: { startsWith: prefix } },
        select: { staffId: true },
      });
      const used = new Set(ids.map(({ staffId }) => staffId));
      let sequence = 1;
      let nextId = `${prefix}${sequence.toString().padStart(3, "0")}`;
      while (used.has(nextId)) {
        sequence++;
        nextId = `${prefix}${sequence.toString().padStart(3, "0")}`;
      }

      await tx.teacher.create({ data: { userId: user.id, staffId: nextId } });
      return nextId;
    });

    if (staffId) {
      console.log(`Repaired ${user.name} (${user.email}) with staff ID ${staffId}`);
    } else {
      console.log(`Skipped ${user.name} (${user.email}); account changed or was already repaired.`);
    }
  }

  if (orphanUsers.length === 0) {
    console.log("No orphan teacher/principal users found.");
  }
}

repairOrphanTeachers()
  .catch((error) => {
    console.error("Failed to repair orphan teachers:", error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
