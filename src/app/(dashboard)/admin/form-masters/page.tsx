import { db } from "@/lib/prisma";
import { FormMasterList } from "./_components/form-master-list";
import { AddFormMasterButton } from "./_components/add-form-master-button";

export default async function AdminFormMastersPage() {
  const [formMasters, teachersRaw, classes] = await Promise.all([
    db.formMaster.findMany({
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        class: { select: { name: true } },
      },
    }),
    db.teacher.findMany({
      include: { user: { select: { name: true } } },
    }),
    db.class.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const teachers = teachersRaw.map((t) => ({
    id: t.id,
    name: t.user.name,
  }));

  return (
    <div className="max-w-6xl mx-auto py-4 px-4 md:py-8 md:px-6 space-y-6 overflow-x-hidden">
      {/* Responsive Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b pb-6">
        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight md:text-4xl text-foreground">
            Form Masters
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Assign teachers to manage specific classes.
          </p>
        </div>
        <div className="w-full sm:w-auto shrink-0">
          <AddFormMasterButton teachers={teachers} classes={classes} />
        </div>
      </div>

      {/* Table Wrapper */}
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
        <FormMasterList initialData={formMasters} />
      </div>
    </div>
  );
}
