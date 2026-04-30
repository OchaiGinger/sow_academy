"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { createSession, updateSession } from "@/app/actions/session-action";
import { useState } from "react";

const sessionSchema = z.object({
  name: z
    .string()
    .min(1, "Session name is required.")
    .regex(/^\d{4}\/\d{4}$/, "Format must be YYYY/YYYY — e.g. 2024/2025"),
});

type SessionFormData = z.infer<typeof sessionSchema>;

interface SessionFormProps {
  onSuccess: () => void;
  initial?: { id: string; name: string };
}

export function SessionForm({ onSuccess, initial }: SessionFormProps) {
  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: { name: initial?.name ?? "" },
  });

  const {
    formState: { isSubmitting, errors },
  } = form;

  // Separate state for server-level errors (not field errors)
  const [serverError, setServerError] = useState<{
    message: string;
    detail?: string;
  } | null>(null);

  async function onSubmit(data: SessionFormData) {
    setServerError(null);
    try {
      if (initial) {
        await updateSession(initial.id, data.name);
      } else {
        await createSession(data.name);
      }
      onSuccess();
    } catch (e: any) {
      // Show the real error — not a generic message
      setServerError({
        message: e?.message ?? "An unexpected error occurred.",
        detail: e?.cause
          ? String(e.cause)
          : e?.code
            ? `Error code: ${e.code}`
            : undefined,
      });
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Session Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 2024/2025" autoFocus {...field} />
              </FormControl>
              <FormMessage /> {/* shows zod field error inline */}
            </FormItem>
          )}
        />

        {/* Server error — shown as a dismissible alert with full detail */}
        {serverError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="flex items-center justify-between">
              {serverError.message}
              <button
                type="button"
                onClick={() => setServerError(null)}
                className="text-xs underline opacity-70 hover:opacity-100"
              >
                Dismiss
              </button>
            </AlertTitle>
            {serverError.detail && (
              <AlertDescription className="mt-1 font-mono text-xs break-all">
                {serverError.detail}
              </AlertDescription>
            )}
            {/* Retry button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 w-full gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => {
                setServerError(null);
                form.handleSubmit(onSubmit)();
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </Button>
          </Alert>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting
            ? initial
              ? "Updating..."
              : "Creating..."
            : initial
              ? "Update Session"
              : "Create Session"}
        </Button>
      </form>
    </Form>
  );
}
