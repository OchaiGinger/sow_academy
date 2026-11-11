import { db } from "@/lib/prisma";

async function searchStudent() {
  // Search for students with name containing "agness" or "alexader" (case insensitive)
  const students = await db.student.findMany({
    include: {
      user: { select: { name: true, email: true, phone: true, id: true } },
      class: true
    },
    where: {
      OR: [
        { user: { name: { contains: "agness", mode: "insensitive" } } },
        { user: { name: { contains: "alexader", mode: "insensitive" } } },
        { user: { email: { contains: "agness", mode: "insensitive" } } },
        { user: { email: { contains: "alexader", mode: "insensitive" } } },
      ]
    }
  });

  console.log("Found students matching 'agness' or 'alexader':");
  console.log(JSON.stringify(students, null, 2));

  // Also search for any student with similar names
  const allStudents = await db.student.findMany({
    include: {
      user: { select: { name: true, email: true, phone: true, id: true } },
      class: true
    }
  });

  console.log("\n\nAll students in database:");
  allStudents.forEach(s => {
    console.log(`- ${s.user.name} (${s.user.email}) - Admission: ${s.admissionNo} - Class: ${s.class?.name || 'None'}`);
  });
}

searchStudent()
  .catch(console.error)
  .finally(() => process.exit(0));