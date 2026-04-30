"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Trash2,
  Mail,
  Hash,
  BookOpen,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import {
  deleteTeacher,
  togglePrincipalRole,
} from "@/app/actions/teacher-actions";
import { toast } from "sonner";

// Define the exact structure expected from the Database
interface TeacherItem {
  id: string; // Teacher Record ID
  userId: string; // User Record ID
  staffId: string | null;
  user: {
    id: string; // User ID (mapped to userId)
    name: string;
    email: string;
    role: string; // Must be selected in Prisma query
    phone: string | null;
    image: string | null;
  };
  _count: {
    classSubjects: number;
  };
}

export function TeacherList({ initialData }: { initialData: TeacherItem[] }) {
  const handleTogglePrincipal = async (userId: string, currentRole: string) => {
    const isPromoting = currentRole !== "PRINCIPAL";
    const confirmMsg = isPromoting
      ? "Promote this teacher to Principal? They will have authority to apply official school stamps."
      : "Revoke Principal authority? They will return to a standard Teacher role.";

    if (confirm(confirmMsg)) {
      const res = await togglePrincipalRole(userId, isPromoting);
      if (res.success) {
        toast.success(
          isPromoting
            ? "Role updated to Principal"
            : "Role reverted to Teacher",
        );
      } else {
        toast.error(res.error || "Failed to update role");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (
      confirm(
        "Are you sure? This will remove the teacher's profile and unassign their subjects.",
      )
    ) {
      const res = await deleteTeacher(id);
      if (res.success) {
        toast.success("Teacher profile removed");
      } else {
        toast.error(res.error);
      }
    }
  };

  return (
    <Table>
      <TableHeader className="bg-bg-elevated">
        <TableRow>
          <TableHead className="text-[10px] uppercase tracking-widest font-bold">
            Teacher
          </TableHead>
          <TableHead className="text-[10px] uppercase tracking-widest font-bold">
            Staff ID
          </TableHead>
          <TableHead className="text-[10px] uppercase tracking-widest font-bold text-center">
            Workload
          </TableHead>
          <TableHead className="text-right text-[10px] uppercase tracking-widest font-bold">
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="text-sm">
        {initialData.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={4}
              className="text-center py-12 text-text-tertiary italic"
            >
              No teacher profiles found in the system.
            </TableCell>
          </TableRow>
        ) : (
          initialData.map((teacher) => (
            <TableRow
              key={teacher.id}
              className="hover:bg-bg-elevated/50 transition-colors"
            >
              <TableCell className="flex items-center gap-3 py-4">
                <Avatar className="h-8 w-8 rounded-sm border border-border-subtle">
                  <AvatarImage src={teacher.user.image || ""} />
                  <AvatarFallback className="rounded-sm bg-primary/10 text-primary text-xs font-bold">
                    {teacher.user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text-primary">
                      {teacher.user.name}
                    </span>
                    {teacher.user.role === "PRINCIPAL" && (
                      <Badge className="bg-primary/10 text-primary border-none text-[8px] h-4 uppercase font-bold px-1.5">
                        Principal
                      </Badge>
                    )}
                  </div>
                  <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                    <Mail className="h-2.5 w-2.5" /> {teacher.user.email}
                  </span>
                </div>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-primary">
                  <Hash className="h-3 w-3 text-text-tertiary" />
                  {teacher.staffId || "---"}
                </div>
              </TableCell>

              <TableCell className="text-center">
                <div className="inline-flex items-center gap-2 bg-bg-elevated px-2 py-1 rounded border border-border-subtle">
                  <BookOpen className="h-3 w-3 text-primary" />
                  <span className="text-xs font-bold">
                    {teacher._count.classSubjects}
                  </span>
                </div>
              </TableCell>

              <TableCell className="text-right space-x-1">
                {/* PRINCIPAL TOGGLE */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${
                    teacher.user.role === "PRINCIPAL"
                      ? "text-primary bg-primary/10 hover:bg-primary/20"
                      : "text-text-tertiary hover:text-primary"
                  }`}
                  onClick={() =>
                    handleTogglePrincipal(teacher.user.id, teacher.user.role)
                  }
                  title={
                    teacher.user.role === "PRINCIPAL"
                      ? "Revoke Principal Role"
                      : "Make Principal"
                  }
                >
                  {teacher.user.role === "PRINCIPAL" ? (
                    <ShieldCheck className="h-4 w-4" />
                  ) : (
                    <ShieldAlert className="h-4 w-4" />
                  )}
                </Button>

                {/* EDIT BUTTON */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>

                {/* DELETE BUTTON */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(teacher.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
