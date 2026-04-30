"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { classSchema, type ClassFormValues } from "@/lib/zodSchemas";
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
import { upsertClass } from "@/app/actions/class-actions";
import { toast } from "sonner";

export function ClassForm({
  initialData,
  onSuccess,
}: {
  initialData?: ClassFormValues;
  onSuccess: () => void;
}) {
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: initialData || { name: "", level: "", arm: "" },
  });

  async function onSubmit(values: ClassFormValues) {
    const result = await upsertClass(values);
    if (result.success) {
      toast.success(values.id ? "Class updated" : "Class created");
      onSuccess();
    } else {
      toast.error(result.error);
    }
  }

  // ADD THIS RETURN BLOCK:
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. JSS1A" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Level</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. JSS1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="arm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Arm</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. A" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full">
          {initialData?.id ? "Update Class" : "Create Class"}
        </Button>
      </form>
    </Form>
  );
}
