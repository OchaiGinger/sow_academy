import { db } from "@/lib/prisma";
import { PasswordRow } from "./_components/password-row";

export default async function AdminCardPasswordsPage() {
  const activeTerm = await db.term.findFirst({ where: { isCurrent: true } });
  const classes = await db.class.findMany({
    include: {
      termCardPasswords: {
        where: { termId: activeTerm?.id },
      },
    },
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Exam Passwords - {activeTerm?.name} Term
      </h1>
      <div className="border rounded-lg">
        <table className="w-full text-left">
          <thead className="bg-muted">
            <tr>
              <th className="p-3">Class Name</th>
              <th className="p-3">Result Password</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((cls) => (
              <PasswordRow
                key={cls.id}
                classId={cls.id}
                className={cls.name}
                termId={activeTerm?.id!}
                initialPassword={cls.termCardPasswords[0]?.password || ""}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
