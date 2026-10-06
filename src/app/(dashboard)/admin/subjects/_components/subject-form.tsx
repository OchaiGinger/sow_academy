"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { subjectSchema, type SubjectFormValues } from "@/lib/zodSchemas";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox"; // Make sure to install this shadcn component
import { upsertSubject } from "@/app/actions/subject-actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  initialData?: SubjectFormValues;
  onSuccess: () => void;
  classes: {
    id: string;
    name: string;
    students: { id: string; name: string }[];
  }[];
}

export function SubjectForm({ initialData, onSuccess, classes }: Props) {
  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: initialData ?? {
      name: "",
      code: "",
      offerings: classes.map((cls) => ({
        classId: cls.id,
        enabled: false,
        isElective: false,
        studentIds: [],
      })),
    },
  });
  const offerings = useWatch({ control: form.control, name: "offerings" });

  async function onSubmit(values: SubjectFormValues) {
    try {
      const result = await upsertSubject(values);
      if (result.success) {
        toast.success("Saved successfully");
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to save subject");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject Code</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Class offerings</FormLabel>
          <p className="text-xs text-muted-foreground">
            Select each class where this subject is offered. Existing class assignments and elective students are preselected when editing.
          </p>
          <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
            {classes.map((cls, index) => {
              const offering = offerings?.[index];
              const isEnabled = offering?.enabled ?? false;
              const isElective = offering?.isElective ?? false;
              const studentIds = offering?.studentIds ?? [];

              return (
                <div key={cls.id} className="space-y-3 rounded-md border p-3">
                  <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
                    <Checkbox
                      checked={isEnabled}
                      onCheckedChange={(checked) =>
                        form.setValue(`offerings.${index}.enabled`, checked === true, { shouldDirty: true, shouldValidate: true })
                      }
                    />
                    <span>{cls.name}</span>
                    {isEnabled && isElective && (
                      <span className="ml-auto rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-800">Elective</span>
                    )}
                  </label>

                  {isEnabled && (
                    <div className="ml-7 space-y-3">
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={isElective}
                          onCheckedChange={(checked) => {
                            form.setValue(`offerings.${index}.isElective`, checked === true, { shouldDirty: true, shouldValidate: true });
                            if (checked !== true) {
                              form.setValue(`offerings.${index}.studentIds`, [], { shouldDirty: true });
                            }
                          }}
                        />
                        <span>Make elective for {cls.name}</span>
                      </label>

                      {isElective && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium">Select the students from {cls.name} taking this elective</p>
                          <div className="max-h-44 space-y-2 overflow-y-auto rounded-md border p-3">
                            {cls.students.length ? cls.students.map((student) => (
                              <label key={student.id} className="flex cursor-pointer items-center gap-3 text-sm">
                                <Checkbox
                                  checked={studentIds.includes(student.id)}
                                  onCheckedChange={(checked) => {
                                    const nextIds = checked === true
                                      ? [...studentIds, student.id]
                                      : studentIds.filter((id) => id !== student.id);
                                    form.setValue(`offerings.${index}.studentIds`, nextIds, { shouldDirty: true, shouldValidate: true });
                                  }}
                                />
                                <span>{student.name}</span>
                              </label>
                            )) : (
                              <p className="text-sm text-muted-foreground">No students are currently assigned to this class.</p>
                            )}
                          </div>
                          {form.formState.errors.offerings?.[index]?.studentIds?.message && (
                            <p className="text-sm font-medium text-destructive">{form.formState.errors.offerings[index]?.studentIds?.message}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {form.formState.errors.offerings?.message && (
            <p className="text-sm font-medium text-destructive">{form.formState.errors.offerings.message}</p>
          )}
        </FormItem>

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save Subject"}
        </Button>
      </form>
    </Form>
  );
}
