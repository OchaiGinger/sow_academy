"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { teacherSchema, type TeacherFormValues } from "@/lib/zodSchemas";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { createTeacher } from "@/app/actions/teacher-actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface Props {
  onSuccess: () => void;
  availableSubjects: any[];
}

export function TeacherForm({ onSuccess, availableSubjects = [] }: Props) {
  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    mode: "onBlur", // Validates when the user clicks out of an input
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      classSubjectIds: [],
    },
  });
  const { isSubmitting, errors } = form.formState;

  // Debugging: Log any validation errors that appear in the state
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log("Current Form Errors:", errors);
    }
  }, [errors]);

  async function onSubmit(values: TeacherFormValues) {
    const res = await createTeacher(values);

    if (res.success) {
      toast.success("Teacher created successfully!");
      form.reset();
      onSuccess();
      window.location.reload();
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
          toast.error("Form validation failed. Check console.");
        })}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs uppercase font-bold">
                Full Name
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="John Doe"
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs uppercase font-bold">
                Email
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="teacher@school.com"
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
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs uppercase font-bold">
                Password
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="******"
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
          name="classSubjectIds"
          render={() => (
            <FormItem>
              <FormLabel className="text-xs uppercase font-bold">
                Assign Subjects
              </FormLabel>
              <div className="grid grid-cols-1 gap-2 border border-border-subtle rounded-sm p-3 max-h-48 overflow-y-auto bg-bg-elevated">
                {availableSubjects.map((cs) => (
                  <FormField
                    key={cs.id}
                    control={form.control}
                    name="classSubjectIds"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 py-1">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(cs.id)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              return checked
                                ? field.onChange([...current, cs.id])
                                : field.onChange(
                                    current.filter((v: string) => v !== cs.id),
                                  );
                            }}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormLabel className="text-[11px] font-mono font-bold cursor-pointer">
                          {cs.class?.name} — {cs.subject?.name}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Register Teacher"
          )}
        </Button>
      </form>
    </Form>
  );
}
