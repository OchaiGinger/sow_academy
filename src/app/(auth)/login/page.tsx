"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// ── Validation schema ──────────────────────────────────────────
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ──────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);

    try {
      const { data, error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
      });

      if (error) {
        const msg = error.message || "Invalid credentials. Please try again.";
        setServerError(msg); // banner at top of form
        toast.error(msg); // toast notification
        return;
      }

      toast.success("Login successful");
      router.push("/");
    } catch {
      const msg = "An unexpected error occurred. Please try again.";
      setServerError(msg);
      toast.error(msg);
    }
  };

  return (
    <>
      {/* Toaster — mount once at page level */}
      <Toaster position="top-right" richColors />

      <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-bg-surface border border-border-subtle rounded-sm p-8 shadow-2xl">
          {/* Brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="text-primary text-4xl font-black tracking-tighter mb-1">
              AcademiaFlow
            </div>
            <div className="text-text-secondary text-2xs uppercase tracking-widest font-semibold">
              Terminal Access
            </div>
          </div>

          {/* ── Server-error banner ── */}
          {serverError && (
            <div className="flex items-start gap-2.5 mb-5 px-3.5 py-3 rounded-sm border border-destructive/40 bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* ── Form ── */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-text-secondary text-2xs uppercase font-bold">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="you@school.edu"
                        className="bg-bg-input border-border-default focus:border-primary/50"
                        {...field}
                      />
                    </FormControl>
                    {/* Inline field error */}
                    <FormMessage className="text-destructive text-xs" />
                  </FormItem>
                )}
              />

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-text-secondary text-2xs uppercase font-bold">
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="bg-bg-input border-border-default focus:border-primary/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-destructive text-xs" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-primary text-bg-base hover:bg-accent-dim font-bold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Authenticate"
                )}
              </Button>
            </form>
          </Form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border-subtle text-center">
            <p className="text-text-tertiary text-2xs uppercase tracking-wider">
              Enterprise School Records Management System
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
