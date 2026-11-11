import { config } from "dotenv";
config();
async function main() {
  const { db } = await import("./src/lib/prisma");
  const s = await db.student.findFirst({ include: { user: { select: { image: true, name: true } } } });
  console.log(JSON.stringify({ name: s?.user?.name, image: s?.user?.image, hasImage: !!s?.user?.image }, null, 2));
  await db.$disconnect();
}
main().catch((e) => { console.error(e.message); process.exit(1); });
