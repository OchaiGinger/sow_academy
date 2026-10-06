"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formMasterSchema, type FormMasterFormValues } from "@/lib/zodSchemas";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignFormMaster } from "@/app/actions/form-master-actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  teachers: { id: string; name: string }[];
  classes: { id: string; name: string }[];
  onSuccess: () => void;
}

export function FormMasterForm({ teachers, classes, onSuccess }: Props) {
  const form = useForm<FormMasterFormValues>({
    resolver: zodResolver(formMasterSchema),
    defaultValues: { teacherId: "", classIds: [] },
  });

  async function onSubmit(values: FormMasterFormValues) {
    try {
      const result = await assignFormMaster(values);
      if (result.success) {
        toast.success("Form Master assigned successfully");
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to assign Form Master");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="teacherId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teacher</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={form.formState.isSubmitting}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="classIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Classes</FormLabel>
              <FormControl>
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-3">
                  {classes.map((c) => {
                    const checked = field.value.includes(c.id);
                    return (
                      <label key={c.id} className="flex cursor-pointer items-center gap-3 text-sm">
                        <Checkbox
                          checked={checked}
                          disabled={form.formState.isSubmitting}
                          onCheckedChange={(isChecked) => {
                            const next = isChecked
                              ? [...field.value, c.id]
                              : field.value.filter((id) => id !== c.id);
                            field.onChange(next);
                          }}
                        />
                        <span>{c.name}</span>
                      </label>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Assigning…
            </>
          ) : (
            "Assign Form Master"
          )}
        </Button>
      </form>
    </Form>
  );
}
