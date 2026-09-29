import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

config({ path: ".env" });

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const users = await db.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    take: 20,
  });
  console.log(JSON.stringify(users, null, 2));

  const subjects = await db.subject.findMany({
    include: { classSubjects: { select: { classId: true } } },
  });
  console.log("SUBJECTS:", JSON.stringify(subjects, null, 2));
}

main().finally(() => db.$disconnect());
