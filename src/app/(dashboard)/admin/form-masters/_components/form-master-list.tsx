"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, UserCheck, ShieldCheck } from "lucide-react";
import { removeFormMaster } from "@/app/actions/form-master-actions";
import { toast } from "sonner";

interface FormMasterItem {
  id: string;
  teacher: {
    user: { name: string };
  };
  class: { name: string };
}

export function FormMasterList({
  initialData,
}: {
  initialData: FormMasterItem[];
}) {
  const handleRemove = async (id: string) => {
    if (
      confirm("Are you sure you want to remove this teacher as Form Master?")
    ) {
      try {
        await removeFormMaster(id);
        toast.success("Assignment removed successfully");
      } catch (error) {
        toast.error("Failed to remove assignment");
      }
    }
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden w-full shadow-sm">
      <Table className="w-full table-fixed border-collapse">
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[35%] sm:w-[30%] px-4 py-3 text-[10px] font-bold uppercase tracking-widest">
              Class
            </TableHead>
            <TableHead className="w-[45%] sm:w-[50%] px-2 py-3 text-[10px] font-bold uppercase tracking-widest">
              Form Master
            </TableHead>
            <TableHead className="w-[20%] text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center py-16 text-muted-foreground"
              >
                <div className="flex flex-col items-center gap-2">
                  <ShieldCheck className="h-8 w-8 opacity-20" />
                  <p className="text-sm italic">
                    No Form Masters assigned yet.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            initialData.map((item) => (
              <TableRow
                key={item.id}
                className="group transition-colors hover:bg-muted/5"
              >
                <TableCell className="px-4 py-4">
                  <span className="font-bold text-sm sm:text-base">
                    {item.class.name}
                  </span>
                </TableCell>
                <TableCell className="px-2 py-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="hidden sm:flex h-7 w-7 rounded-full bg-primary/10 items-center justify-center shrink-0">
                      <UserCheck className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span
                      className="truncate text-sm font-medium text-foreground/80"
                      title={item.teacher.user.name}
                    >
                      {item.teacher.user.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={() => handleRemove(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {initialData.length > 0 && (
        <div className="p-4 bg-muted/20 border-t">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
            Showing {initialData.length} Active Assignment
            {initialData.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
