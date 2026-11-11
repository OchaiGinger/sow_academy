import { config } from "dotenv";
config({ path: ".env" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function searchUser() {
  // Search for users with name containing "agnes" or "alexander" (case insensitive)
  const users = await db.user.findMany({
    where: {
      OR: [
        { name: { contains: "agnes", mode: "insensitive" } },
        { name: { contains: "alexander", mode: "insensitive" } },
        { email: { contains: "agnes", mode: "insensitive" } },
        { email: { contains: "alexander", mode: "insensitive" } },
      ]
    },
    include: {
      studentProfile: true,
      teacherProfile: true,
    }
  });

  console.log("Found users matching 'agness' or 'alexader':");
  console.log(JSON.stringify(users, null, 2));

  // Also check for any users with role STUDENT but no student profile
  const orphanStudents = await db.user.findMany({
    where: {
      role: "STUDENT",
      studentProfile: null,
    },
    include: {
      studentProfile: true,
      teacherProfile: true,
    }
  });

  console.log("\n\nUsers with STUDENT role but NO student profile (orphans):");
  console.log(JSON.stringify(orphanStudents, null, 2));
}

searchUser()
  .catch(console.error)
  .finally(() => process.exit(0));