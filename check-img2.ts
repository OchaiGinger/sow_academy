import { config } from "dotenv";
config();
async function main() {
  const { db } = await import("./src/lib/prisma");
  const any = await db.user.findFirst({ where: { role: "STUDENT", image: { not: null } }, select: { name: true, image: true } });
  console.log(JSON.stringify(any, null, 2));
  await db.$disconnect();
}
main().catch((e) => { console.error(e.message); process.exit(1); });
