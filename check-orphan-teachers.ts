import { config } from "dotenv";
config({ path: ".env" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function checkOrphanTeachers() {
  const orphanTeachers = await db.user.findMany({
    where: {
      role: { in: ["TEACHER", "PRINCIPAL"] },
      teacherProfile: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${orphanTeachers.length} teacher/principal users without teacher profiles.`);
  for (const user of orphanTeachers) {
    console.log(`${user.role}\t${user.name}\t${user.email}\t${user.createdAt.toISOString()}`);
  }
}

checkOrphanTeachers()
  .catch((error) => {
    console.error("Failed to check orphan teachers:", error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
