"use client";

import { useForm } from "react-hook-form";
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

interface Props {
  initialData?: SubjectFormValues;
  onSuccess: () => void;
  classes: { id: string; name: string }[]; // Pass classes from the parent
}

export function SubjectForm({ initialData, onSuccess, classes }: Props) {
  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: initialData || { name: "", code: "", classIds: [] },
  });

  async function onSubmit(values: SubjectFormValues) {
    const result = await upsertSubject(values);
    if (result.success) {
      toast.success("Saved successfully");
      onSuccess();
    } else {
      toast.error(result.error);
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

        {/* Classes Multi-Select Area */}
        <FormField
          control={form.control}
          name="classIds"
          render={() => (
            <FormItem>
              <FormLabel>Assigned Classes</FormLabel>
              <div className="grid grid-cols-2 gap-2 border rounded-md p-4 max-h-40 overflow-y-auto">
                {classes.map((cls) => (
                  <FormField
                    key={cls.id}
                    control={form.control}
                    name="classIds"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(cls.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, cls.id])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== cls.id,
                                    ),
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {cls.name}
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

        <Button type="submit" className="w-full">
          Save Subject
        </Button>
      </form>
    </Form>
  );
}
