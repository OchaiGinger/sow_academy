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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    defaultValues: initialData || {
      name: "",
      code: "",
      isElective: false,
      classIds: [],
      electiveClassId: "",
      studentIds: [],
    },
  });
  const isElective = useWatch({ control: form.control, name: "isElective" });
  const electiveClassId = useWatch({ control: form.control, name: "electiveClassId" });
  const studentIds = useWatch({ control: form.control, name: "studentIds" });
  const selectedClass = classes.find((cls) => cls.id === electiveClassId);

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

        <FormField
          control={form.control}
          name="isElective"
          render={({ field }) => (
            <FormItem>
              <label className="flex items-center gap-3 rounded-md border p-3 text-sm cursor-pointer">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked === true);
                    form.setValue("classIds", []);
                    form.setValue("electiveClassId", "");
                    form.setValue("studentIds", []);
                  }}
                />
                <span>Make this an elective subject</span>
              </label>
            </FormItem>
          )}
        />
        {!isElective && (
          <p className="-mt-4 text-xs text-muted-foreground">
            Turn this on to choose a class, then select which students in that class take the subject.
          </p>
        )}

        {isElective ? (
          <>
            <FormField
              control={form.control}
              name="electiveClassId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class offering this elective</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("studentIds", []);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {electiveClassId && (
                <FormField
                  control={form.control}
                  name="studentIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Students from {selectedClass?.name ?? "this class"} taking this elective
                      </FormLabel>
                      <FormControl>
                        <div className="max-h-52 space-y-2 overflow-y-auto rounded-md border p-3">
                          {selectedClass?.students.length ? selectedClass.students.map((student) => (
                            <label key={student.id} className="flex cursor-pointer items-center gap-3 text-sm">
                              <Checkbox
                                checked={studentIds.includes(student.id)}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked === true
                                    ? [...field.value, student.id]
                                    : field.value.filter((id) => id !== student.id));
                                }}
                              />
                              <span>{student.name}</span>
                            </label>
                          )) : (
                            <p className="text-sm text-muted-foreground">No students are currently assigned to this class.</p>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}
          </>
        ) : (
          <FormField
            control={form.control}
            name="classIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned Classes</FormLabel>
                <FormControl>
                  <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto rounded-md border p-4">
                    {classes.map((cls) => (
                      <label key={cls.id} className="flex cursor-pointer items-center gap-3 text-sm">
                        <Checkbox
                          checked={field.value.includes(cls.id)}
                          onCheckedChange={(checked) => field.onChange(checked === true
                            ? [...field.value, cls.id]
                            : field.value.filter((id) => id !== cls.id))}
                        />
                        <span>{cls.name}</span>
                      </label>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save Subject"}
        </Button>
      </form>
    </Form>
  );
}
