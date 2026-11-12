"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  teacherSchema,
  updateTeacherSchema,
  type TeacherFormValues,
  type UpdateTeacherFormValues,
} from "@/lib/zodSchemas";
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
import { Checkbox } from "@/components/ui/checkbox";
import { UploadButton } from "@/components/ui/upload-button";
import { createTeacher, updateTeacher } from "@/app/actions/teacher-actions";
import { toast } from "sonner";
import { BookOpen, Check, Loader2, Search, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface Props {
  onSuccess: () => void;
  availableSubjects: AvailableSubject[];
  initialData?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    image: string | null;
    staffId: string | null;
    classSubjectIds: string[];
  };
}

type AvailableSubject = {
  id: string;
  class: { name: string } | null;
  subject: { name: string } | null;
};

export function TeacherForm({
  onSuccess,
  availableSubjects = [],
  initialData,
}: Props) {
  const isEditMode = !!initialData;

  const form = useForm<TeacherFormValues | UpdateTeacherFormValues>({
    resolver: zodResolver(
      isEditMode ? updateTeacherSchema : teacherSchema,
    ) as never,
    mode: "onBlur", // Validates when the user clicks out of an input
    defaultValues: initialData
      ? {
          name: initialData.name,
          email: initialData.email,
          phone: initialData.phone ?? "",
          image: initialData.image ?? "",
          password: "",
          classSubjectIds: initialData.classSubjectIds,
        }
      : {
          name: "",
          email: "",
          phone: "",
          image: "",
          password: "",
          classSubjectIds: [],
        },
  });
  const { isSubmitting, errors } = form.formState;
  const [subjectQuery, setSubjectQuery] = useState("");
  const selectedSubjectIds = useWatch({ control: form.control, name: "classSubjectIds" }) ?? [];
  const filteredSubjects = useMemo(() => {
    const query = subjectQuery.trim().toLowerCase();
    return availableSubjects.filter((subject) =>
      `${subject.class?.name ?? ""} ${subject.subject?.name ?? ""}`
        .toLowerCase()
        .includes(query),
    );
  }, [availableSubjects, subjectQuery]);

  // Debugging: Log any validation errors that appear in the state
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log("Current Form Errors:", errors);
    }
  }, [errors]);

  async function onSubmit(values: TeacherFormValues | UpdateTeacherFormValues) {
    const res = isEditMode
      ? await updateTeacher(initialData.id, values)
      : await createTeacher(values);

    if (res.success) {
      if (isEditMode) {
        toast.success("Teacher updated successfully!");
      } else if ("emailSent" in res && res.emailSent) {
        toast.success("Teacher created and welcome email sent");
      } else {
        toast.success("Teacher created, but the welcome email failed to send");
      }
      form.reset();
      onSuccess();
    } else {
      // Check if the error is about the email to highlight the specific field
      if (res.error?.toLowerCase().includes("email")) {
        form.setError("email", {
          type: "server",
          message: res.error,
        });
      }
      // Check if the error is about the name
      else if (res.error?.toLowerCase().includes("name")) {
        form.setError("name", {
          type: "server",
          message: res.error,
        });
      }
      // Fallback for general errors
      else {
        toast.error(res.error);
      }
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, (err) => {
          console.log("Validation Failed on Submit Click:", err);
          toast.error("Please check the highlighted fields.");
        })}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-7">
          <div className="grid items-start gap-5 xl:grid-cols-5">
            <section className="space-y-5 rounded-xl border bg-card p-4 sm:p-5 xl:col-span-2">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold">Staff profile</h2>
                  <p className="text-xs text-muted-foreground">Contact details and photo</p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl><Input autoComplete="name" placeholder="Full name" {...field} disabled={isSubmitting} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl><Input type="email" autoComplete="email" placeholder="teacher@school.com" {...field} disabled={isSubmitting} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone number</FormLabel>
                    <FormControl><Input type="tel" autoComplete="tel" placeholder="Optional" {...field} disabled={isSubmitting} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEditMode ? "New password" : "Password"}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder={isEditMode ? "Leave blank to keep current" : "At least 6 characters"}
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile photo</FormLabel>
                    <FormControl>
                      <UploadButton
                        route="teacherProfile"
                        currentUrl={field.value || undefined}
                        onUploadComplete={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <section className="min-w-0 space-y-4 rounded-xl border bg-card p-4 sm:p-5 xl:col-span-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Teaching assignments</h2>
                    <p className="text-xs text-muted-foreground">Select class and subject combinations</p>
                  </div>
                </div>
                <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {selectedSubjectIds.length} selected
                </span>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={subjectQuery}
                  onChange={(event) => setSubjectQuery(event.target.value)}
                  placeholder="Search by class or subject"
                  aria-label="Search teaching assignments"
                  className="pl-9"
                />
              </div>

              <FormField
                control={form.control}
                name="classSubjectIds"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {filteredSubjects.map((subject) => {
                        const checked = field.value?.includes(subject.id) ?? false;
                        return (
                          <label
                            key={subject.id}
                            className={`flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 ${checked ? "border-primary/50 bg-primary/[0.04]" : ""}`}
                          >
                            <FormControl>
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(isChecked) => {
                                  const current = field.value ?? [];
                                  field.onChange(isChecked
                                    ? [...current, subject.id]
                                    : current.filter((id: string) => id !== subject.id));
                                }}
                                disabled={isSubmitting}
                                aria-label={`${subject.class?.name ?? "Class"} — ${subject.subject?.name ?? "Subject"}`}
                              />
                            </FormControl>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold">{subject.subject?.name ?? "Subject"}</span>
                              <span className="block truncate text-xs text-muted-foreground">{subject.class?.name ?? "Class not assigned"}</span>
                            </span>
                            {checked && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
                          </label>
                        );
                      })}
                    </div>
                    {filteredSubjects.length === 0 && (
                      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        {availableSubjects.length === 0 ? "No unassigned subject offerings are available." : "No assignments match your search."}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>
          </div>
        </div>

        <footer className="flex shrink-0 flex-col gap-3 border-t bg-background/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="text-xs text-muted-foreground">
            {selectedSubjectIds.length} subject{selectedSubjectIds.length === 1 ? "" : "s"} assigned
          </p>
          <Button type="submit" className="w-full sm:w-auto sm:min-w-40" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving changes…</> : "Save changes"}
          </Button>
        </footer>
      </form>
    </Form>
  );
}
