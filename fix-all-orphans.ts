import { config } from "dotenv";
config({ path: ".env" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function fixAllOrphanStudents() {
  // Find all users with STUDENT role but no student profile
  const orphanUsers = await db.user.findMany({
    where: {
      role: "STUDENT",
      studentProfile: null,
    },
    include: {
      studentProfile: true,
      teacherProfile: true,
    }
  });

  console.log(`Found ${orphanUsers.length} orphan users (STUDENT role but no student profile):`);
  
  // Get available classes
  const classes = await db.class.findMany({ orderBy: { name: "asc" } });
  
  if (classes.length === 0) {
    console.log("\nNo classes found! Cannot create student profiles without a class.");
    return;
  }

  console.log("\nAvailable classes:");
  classes.forEach(c => console.log(`  - ${c.name} (${c.id})`));

  // Fix all orphans
  for (const user of orphanUsers) {
    console.log(`\nFixing: ${user.name} (${user.email})`);
    
    // Use the first class as default
    const defaultClass = classes[0];
    console.log(`  Assigning to class: ${defaultClass.name} (${defaultClass.id})`);

    // Find a unique admission number
    let admissionNo = "";
    let attempt = 0;
    const year = new Date().getFullYear().toString().slice(-2);
    
    while (true) {
      const count = await db.student.count();
      admissionNo = `SOWA/ST/${year}/${(count + 1 + attempt).toString().padStart(3, "0")}`;
      
      const existing = await db.student.findUnique({ where: { admissionNo } });
      if (!existing) break;
      attempt++;
      if (attempt > 100) {
        console.error(`  ❌ Could not find unique admission number for ${user.name}`);
        break;
      }
    }
    
    console.log(`  Admission number: ${admissionNo}`);

    try {
      const student = await db.student.create({
        data: {
          userId: user.id,
          admissionNo,
          classId: defaultClass.id,
          dateOfBirth: null,
          gender: null,
          guardianName: null,
          guardianPhone: null,
          address: null,
          photo: null,
        },
      });
      console.log(`  ✅ Created student profile: ${student.id}`);
    } catch (error) {
      console.error(`  ❌ Failed to create student profile:`, error);
    }
  }
}

fixAllOrphanStudents()
  .catch(console.error)
  .finally(() => process.exit(0));