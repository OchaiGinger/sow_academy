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
import { Edit, Trash2, GraduationCap, Layers } from "lucide-react";
import { deleteClass } from "@/app/actions/class-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ClassItem {
  id: string;
  name: string;
  level: string;
  arm: string;
}

export function ClassList({ initialClasses }: { initialClasses: ClassItem[] }) {
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this class?")) {
      await deleteClass(id);
      toast.success("Class deleted");
    }
  };

  return (
    <div className="w-full">
      {/* --- MOBILE VIEW (Cards) --- */}
      <div className="grid grid-cols-1 gap-4 md:hidden p-4">
        {initialClasses.map((cls) => (
          <div
            key={cls.id}
            className="bg-bg-surface border border-border-subtle rounded-lg p-4 space-y-3 shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-text-primary">
                  {cls.name}
                </h3>
                <div className="flex gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">
                    Level {cls.level}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bg-elevated text-text-secondary text-[10px] font-bold uppercase">
                    Arm {cls.arm}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-danger hover:bg-danger/10"
                  onClick={() => handleDelete(cls.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {initialClasses.length === 0 && (
          <div className="text-center py-10 text-text-tertiary italic">
            No classes found.
          </div>
        )}
      </div>

      {/* --- DESKTOP VIEW (Table) --- */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-bg-elevated hover:bg-bg-elevated">
              <TableHead className="w-[40%] font-bold">Class Name</TableHead>
              <TableHead className="font-bold">Level</TableHead>
              <TableHead className="font-bold">Arm</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialClasses.map((cls) => (
              <TableRow
                key={cls.id}
                className="hover:bg-bg-elevated/50 transition-colors"
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                      <GraduationCap size={16} />
                    </div>
                    {cls.name}
                  </div>
                </TableCell>
                <TableCell>{cls.level}</TableCell>
                <TableCell>{cls.arm}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-text-secondary hover:text-primary"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-text-tertiary hover:text-danger"
                    onClick={() => handleDelete(cls.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
