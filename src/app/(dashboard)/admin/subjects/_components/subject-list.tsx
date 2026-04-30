"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, BookOpen } from "lucide-react";
import { deleteSubject } from "@/app/actions/subject-actions";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SubjectForm } from "./subject-form";

interface SubjectItem {
  id: string;
  name: string;
  code: string | null;
  classSubjects?: { classId: string }[];
}

interface ClassOption {
  id: string;
  name: string;
}

interface SubjectListProps {
  initialSubjects: SubjectItem[];
  classes: ClassOption[];
}

export function SubjectList({ initialSubjects, classes }: SubjectListProps) {
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(
    null,
  );

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this subject?")) {
      try {
        await deleteSubject(id);
        toast.success("Subject deleted successfully");
      } catch (error) {
        toast.error("Failed to delete subject");
      }
    }
  };

  return (
    <>
      <div className="rounded-xl border bg-card overflow-hidden w-full">
        {/* table-fixed + w-full + overflow-hidden is the "Nuclear Option" for horizontal scrolls */}
        <Table className="w-full table-fixed border-collapse">
          <TableHeader className="bg-muted/50">
            <TableRow>
              {/* Assigning explicit % widths ensures the table never exceeds 100% */}
              <TableHead className="w-[50%] sm:w-[60%] px-4">Subject</TableHead>
              <TableHead className="w-[25%] sm:w-[20%] px-2">Code</TableHead>
              <TableHead className="w-[25%] sm:w-[20%] text-right px-4">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialSubjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-8 w-8 opacity-20" />
                    <p className="text-sm">No subjects found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              initialSubjects.map((subject) => (
                <TableRow key={subject.id} className="group transition-colors">
                  <TableCell className="px-4 py-3">
                    {/* min-w-0 + truncate prevents long text from breaking the row */}
                    <div className="flex flex-col min-w-0">
                      <span
                        className="font-medium text-sm sm:text-base truncate"
                        title={subject.name}
                      >
                        {subject.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-2">
                    <code className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono whitespace-nowrap">
                      {subject.code || "---"}
                    </code>
                  </TableCell>
                  <TableCell className="px-4 text-right">
                    <div className="flex justify-end items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => setEditingSubject(subject)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(subject.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet
        open={!!editingSubject}
        onOpenChange={(open) => !open && setEditingSubject(null)}
      >
        {/* Using w-full with sm:max-w-md for mobile-first sheets */}
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Subject</SheetTitle>
          </SheetHeader>
          <div className="mt-8 pb-10">
            {editingSubject && (
              <SubjectForm
                classes={classes}
                initialData={{
                  id: editingSubject.id,
                  name: editingSubject.name,
                  code: editingSubject.code || "",
                  classIds:
                    editingSubject.classSubjects?.map((cs) => cs.classId) || [],
                }}
                onSuccess={() => setEditingSubject(null)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
