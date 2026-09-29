import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import crypto from "node:crypto";

config({ path: ".env" });

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const admin = await db.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) throw new Error("No admin user found");

  const token = crypto.randomBytes(32).toString("hex");

  await db.session.create({
    data: {
      token,
      userId: admin.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  console.log("TOKEN=" + token);
  console.log("ADMIN_EMAIL=" + admin.email);
}

main().finally(() => db.$disconnect());
