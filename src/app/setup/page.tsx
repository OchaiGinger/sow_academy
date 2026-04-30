"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver, Path } from "react-hook-form";
import { setupFormSchema, type SetupFormData } from "@/lib/validations/setup";
import { StepIndicator } from "@/components/setup/step-indicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, UploadCloud } from "lucide-react";

const STEP_FIELDS: Record<number, Path<SetupFormData>[]> = {
  1: [
    "schoolName",
    "schoolEmail",
    "schoolPhone",
    "schoolAddress",
    "schoolWebsite",
    "schoolDescription",
  ],
  2: ["schoolLogo", "schoolStamp", "schoolMotto", "principalName"],
  3: ["adminName", "password", "confirmPassword", "resultCardPrice"],
};

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<SetupFormData>({
    resolver: zodResolver(setupFormSchema) as Resolver<SetupFormData>,
    defaultValues: {
      schoolName: "",
      schoolEmail: "",
      schoolPhone: "",
      schoolAddress: "",
      schoolWebsite: "",
      schoolDescription: "",
      schoolLogo: "",
      schoolStamp: "",
      schoolMotto: "",
      principalName: "",
      adminName: "",
      password: "",
      confirmPassword: "",
      resultCardPrice: 500,
    },
  });

  const nextStep = async () => {
    const fields = STEP_FIELDS[step];
    const isValid = await form.trigger(fields, { shouldFocus: true });
    if (isValid) setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  const onSubmit = async (data: SetupFormData) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/setup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to complete setup");
      }

      toast.success(
        "School and Admin account created! Redirecting to login...",
      );
      setTimeout(() => router.push("/login"), 2000);
    } catch (error: any) {
      toast.error(error.message);
      setIsLoading(false);
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: Path<SetupFormData>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue(fieldName, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const errors = form.formState.errors;

  return (
    <div className="space-y-6">
      <StepIndicator
        currentStep={step}
        totalSteps={3}
        labels={["School Profile", "Branding", "Admin Setup"]}
      />

      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary">
          {step === 1 && "Basic School Information"}
          {step === 2 && "Visual Identity"}
          {step === 3 && "Create Administrator Account"}
        </h2>
        <p className="text-sm text-text-secondary">
          {step === 1 &&
            "Enter the primary details for your educational institution."}
          {step === 2 &&
            "Upload your school's logo and digital stamps for result cards."}
          {step === 3 && "This account will have full control over the system."}
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Step 1 ── */}
        {step === 1 && (
          <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="space-y-2">
              <Label>School Name *</Label>
              <Input
                placeholder="e.g. Greenfield Academy"
                {...form.register("schoolName")}
              />
              {errors.schoolName && (
                <p className="text-xs text-danger">
                  {errors.schoolName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>School Email *</Label>
              <Input
                type="email"
                placeholder="admin@school.edu.ng"
                {...form.register("schoolEmail")}
              />
              {errors.schoolEmail && (
                <p className="text-xs text-danger">
                  {errors.schoolEmail.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>School Phone</Label>
                <Input
                  placeholder="+234..."
                  {...form.register("schoolPhone")}
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  placeholder="https://..."
                  {...form.register("schoolWebsite")}
                />
                {errors.schoolWebsite && (
                  <p className="text-xs text-danger">
                    {errors.schoolWebsite.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>School Address</Label>
              <Textarea
                placeholder="Full physical address"
                {...form.register("schoolAddress")}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Short Description</Label>
              <Textarea
                placeholder="A brief about the school"
                {...form.register("schoolDescription")}
                rows={2}
              />
              {errors.schoolDescription && (
                <p className="text-xs text-danger">
                  {errors.schoolDescription.message}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label>School Logo</Label>
                <div
                  className="border-2 border-dashed border-border-default rounded-sm h-40 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-bg-input overflow-hidden relative"
                  onClick={() =>
                    document.getElementById("logo-upload")?.click()
                  }
                >
                  {form.watch("schoolLogo") ? (
                    <img
                      src={form.watch("schoolLogo")}
                      className="w-full h-full object-contain p-2"
                      alt="Logo preview"
                    />
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-text-tertiary mb-2" />
                      <span className="text-2xs text-text-tertiary uppercase">
                        Click to upload
                      </span>
                    </>
                  )}
                  <input
                    id="logo-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "schoolLogo")}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label>School Stamp</Label>
                <div
                  className="border-2 border-dashed border-border-default rounded-sm h-40 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-bg-input overflow-hidden relative"
                  onClick={() =>
                    document.getElementById("stamp-upload")?.click()
                  }
                >
                  {form.watch("schoolStamp") ? (
                    <img
                      src={form.watch("schoolStamp")}
                      className="w-full h-full object-contain rounded-full p-2"
                      alt="Stamp preview"
                    />
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-text-tertiary mb-2" />
                      <span className="text-2xs text-text-tertiary uppercase">
                        Click to upload
                      </span>
                    </>
                  )}
                  <input
                    id="stamp-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "schoolStamp")}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>School Motto</Label>
              <Input
                placeholder="e.g. Excellence in All Things"
                {...form.register("schoolMotto")}
              />
            </div>
            <div className="space-y-2">
              <Label>Principal's Full Name *</Label>
              <Input
                placeholder="Prof. Jane Doe"
                {...form.register("principalName")}
              />
              {errors.principalName && (
                <p className="text-xs text-danger">
                  {errors.principalName.message}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Step 3 ── */}
        {step === 3 && (
          <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-sm mb-2">
              <p className="text-xs text-primary font-medium">
                This account will have full control over the system.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Administrator Full Name *</Label>
              <Input placeholder="Full Name" {...form.register("adminName")} />
              {errors.adminName && (
                <p className="text-xs text-danger">
                  {errors.adminName.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input type="password" {...form.register("password")} />
                {errors.password && (
                  <p className="text-xs text-danger">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Confirm Password *</Label>
                <Input type="password" {...form.register("confirmPassword")} />
                {errors.confirmPassword && (
                  <p className="text-xs text-danger">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Result Card Price (Naira) *</Label>
              <Input
                type="number"
                {...form.register("resultCardPrice", { valueAsNumber: true })}
              />
              {errors.resultCardPrice && (
                <p className="text-xs text-danger">
                  {errors.resultCardPrice.message}
                </p>
              )}
              <p className="text-2xs text-text-tertiary">
                Amount students pay per term to unlock their digital report
                sheet.
              </p>
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="flex gap-3 pt-6 border-t border-border-subtle">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={prevStep}
              disabled={isLoading}
            >
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button
              type="button"
              className="flex-1 bg-primary text-bg-base hover:bg-accent-dim font-bold"
              onClick={nextStep}
            >
              Next step
            </Button>
          ) : (
            <Button
              type="submit"
              className="flex-1 bg-primary text-bg-base hover:bg-accent-dim font-bold"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Finalize and Create Records"
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
