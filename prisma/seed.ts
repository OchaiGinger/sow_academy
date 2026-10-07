import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import bcrypt from "bcryptjs";

config();

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const db = new PrismaClient({ adapter });

  const email = "samuelgingermichaelochai@gmail.com";
  const password = "Badboysforlife@1";

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Super admin already exists:", email);
    await db.$disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      email,
      name: "Super Admin",
      role: "SUPER_ADMIN",
      emailVerified: true,
      accounts: {
        create: {
          providerId: "credential",
          accountId: email,
          password: hashedPassword,
        },
      },
    },
  });

  console.log("Super admin created:", user.email, user.id);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
