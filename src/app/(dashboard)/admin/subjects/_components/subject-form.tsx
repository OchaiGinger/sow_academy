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
import { BookOpen, Check, GraduationCap, Loader2, Search, Users } from "lucide-react";
import { useState } from "react";

interface Props {
  initialData?: SubjectFormValues;
  onSuccess: () => void;
  classes: {
    id: string;
    name: string;
    level: string;
    students: { id: string; name: string }[];
  }[];
  teachers: {
    id: string;
    staffId: string | null;
    user: { name: string };
  }[];
}

export function SubjectForm({ initialData, onSuccess, classes, teachers }: Props) {
  const isJuniorSecondary = (className: string, level: string) =>
    /^(?:JSS|JUNIOR(?:\s+SECONDARY)?)\s*[-_]?\s*[1-3](?:\s*[A-Z])?$/i.test(level.trim()) ||
    /^(?:JSS|JUNIOR(?:\s+SECONDARY)?)\s*[-_]?\s*[1-3](?:\s*[A-Z])?$/i.test(className.trim());
  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: initialData ? {
      ...initialData,
      offerings: initialData.offerings.map((offering, index) =>
        isJuniorSecondary(classes[index]?.name ?? "", classes[index]?.level ?? "")
          ? { ...offering, isElective: false, studentIds: [] }
          : offering,
      ),
    } : {
      name: "",
      code: "",
      offerings: classes.map((cls) => ({
        classId: cls.id,
        enabled: false,
        isElective: false,
        studentIds: [],
        teacherId: null,
      })),
    },
  });
  const offerings = useWatch({ control: form.control, name: "offerings" });
  const [classQuery, setClassQuery] = useState("");
  const enabledCount = offerings?.filter((offering) => offering.enabled).length ?? 0;
  const electiveCount = offerings?.filter((offering, index) =>
    offering.enabled && offering.isElective && !isJuniorSecondary(classes[index]?.name ?? "", classes[index]?.level ?? ""),
  ).length ?? 0;

  async function onSubmit(values: SubjectFormValues) {
    try {
      const normalizedValues = {
        ...values,
        offerings: values.offerings.map((offering, index) =>
          isJuniorSecondary(classes[index]?.name ?? "", classes[index]?.level ?? "")
            ? { ...offering, isElective: false, studentIds: [] }
            : offering,
        ),
      };
      const result = await upsertSubject(normalizedValues);
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-7 overflow-y-auto overscroll-contain px-5 py-6 sm:px-7">
          <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold">Subject details</h2>
                <p className="text-xs text-muted-foreground">Names and codes help staff identify the subject.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject name</FormLabel>
                    <FormControl><Input placeholder="e.g. Mathematics" autoFocus {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject code</FormLabel>
                    <FormControl><Input placeholder="e.g. MTH101" className="uppercase" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold">Class availability</h2>
                  <p className="text-xs text-muted-foreground">Choose classes that offer this subject. Configure electives individually.</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2 text-xs">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">{enabledCount} classes</span>
                {electiveCount > 0 && <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-800">{electiveCount} electives</span>}
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={classQuery} onChange={(event) => setClassQuery(event.target.value)} placeholder="Find a class…" className="pl-9" aria-label="Search classes" />
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {classes.map((cls, index) => ({ cls, index })).filter(({ cls }) => cls.name.toLowerCase().includes(classQuery.trim().toLowerCase())).map(({ cls, index }) => {
                const offering = offerings?.[index];
                const isEnabled = offering?.enabled ?? false;
                const juniorSecondary = isJuniorSecondary(cls.name, cls.level);
                const isElective = !juniorSecondary && (offering?.isElective ?? false);
                const studentIds = juniorSecondary ? [] : offering?.studentIds ?? [];

                return (
                  <article key={cls.id} className={`min-w-0 overflow-hidden rounded-xl border transition-colors ${isEnabled ? "border-primary/40 bg-primary/[0.03]" : "bg-card"}`}>
                    <label className="flex cursor-pointer items-center gap-3 p-4">
                      <Checkbox
                        checked={isEnabled}
                        onCheckedChange={(checked) => form.setValue(`offerings.${index}.enabled`, checked === true, { shouldDirty: true, shouldValidate: true })}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{cls.name}</span>
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" />{cls.students.length} students</span>
                      </span>
                      {isEnabled && !isElective && <Check className="h-4 w-4 text-primary" />}
                      {isEnabled && isElective && <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase text-amber-800">Elective</span>}
                    </label>

                    {isEnabled && (
                      <div className="border-t px-4 py-3">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label htmlFor={`subject-teacher-${cls.id}`} className="text-xs font-semibold">Assigned teacher</label>
                            <select
                              id={`subject-teacher-${cls.id}`}
                              value={offering?.teacherId ?? ""}
                              onChange={(event) => form.setValue(`offerings.${index}.teacherId`, event.target.value || null, { shouldDirty: true, shouldValidate: true })}
                              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <option value="">No teacher assigned</option>
                              {teachers.map((teacher) => (
                                <option key={teacher.id} value={teacher.id}>
                                  {teacher.user.name}{teacher.staffId ? ` · ${teacher.staffId}` : ""}
                                </option>
                              ))}
                            </select>
                            <p className="text-[11px] text-muted-foreground">
                              {offering?.teacherId
                                ? `Assigned to ${teachers.find((teacher) => teacher.id === offering.teacherId)?.user.name ?? "selected teacher"}`
                                : "Select a teacher for this class offering."}
                            </p>
                          </div>
                          {juniorSecondary ? (
                            <p className="self-center rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                              Elective subjects are not available for JSS1–JSS3.
                            </p>
                          ) : (
                            <label className="flex cursor-pointer items-center gap-2 self-start pt-6 text-sm">
                              <Checkbox
                                checked={isElective}
                                onCheckedChange={(checked) => {
                                  form.setValue(`offerings.${index}.isElective`, checked === true, { shouldDirty: true, shouldValidate: true });
                                  if (checked !== true) form.setValue(`offerings.${index}.studentIds`, [], { shouldDirty: true });
                                }}
                              />
                              <span className="font-medium">Only selected students take this subject</span>
                            </label>
                          )}
                        </div>

                        {isElective && (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-muted-foreground">Select students in {cls.name}</p>
                              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold">{studentIds.length} selected</span>
                            </div>
                            <div className="max-h-48 divide-y overflow-y-auto overscroll-contain rounded-lg border bg-background">
                              {cls.students.length ? cls.students.map((student) => (
                                <label key={student.id} className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/50">
                                  <Checkbox
                                    checked={studentIds.includes(student.id)}
                                    onCheckedChange={(checked) => {
                                      const nextIds = checked === true ? [...studentIds, student.id] : studentIds.filter((id) => id !== student.id);
                                      form.setValue(`offerings.${index}.studentIds`, nextIds, { shouldDirty: true, shouldValidate: true });
                                    }}
                                  />
                                  <span className="min-w-0 flex-1 truncate">{student.name}</span>
                                </label>
                              )) : <p className="p-4 text-sm text-muted-foreground">No students are currently assigned to this class.</p>}
                            </div>
                            {form.formState.errors.offerings?.[index]?.studentIds?.message && (
                              <p className="text-sm font-medium text-destructive">{form.formState.errors.offerings[index]?.studentIds?.message}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
            {classes.length === 0 && <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Create a class before assigning subjects.</p>}
            {classes.length > 0 && !classes.some((cls) => cls.name.toLowerCase().includes(classQuery.trim().toLowerCase())) && (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No classes match “{classQuery}”.</p>
            )}
            {form.formState.errors.offerings?.message && <p className="text-sm font-medium text-destructive">{form.formState.errors.offerings.message}</p>}
          </section>
        </div>

        <footer className="flex shrink-0 flex-col gap-3 border-t bg-background/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="text-xs text-muted-foreground">{enabledCount ? `${enabledCount} class${enabledCount === 1 ? "" : "es"} selected` : "Select at least one class offering"}</p>
          <Button type="submit" className="w-full sm:w-auto sm:min-w-36" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save subject"}
          </Button>
        </footer>
      </form>
    </Form>
  );
}
