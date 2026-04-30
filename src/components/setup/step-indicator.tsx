import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export function StepIndicator({ currentStep, totalSteps, labels }: StepIndicatorProps) {
  return (
    <div className="relative flex justify-between items-center mb-12 px-4">
      {/* Connector Line */}
      <div className="absolute top-1/2 left-0 w-full h-px bg-border-subtle -translate-y-1/2 z-0" />
      
      {Array.from({ length: totalSteps }).map((_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        
        return (
          <div key={i} className="relative z-10 flex flex-col items-center">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                isActive ? "bg-bg-surface border-primary text-primary" :
                isCompleted ? "bg-primary border-primary text-bg-base" :
                "bg-bg-surface border-border-subtle text-text-tertiary"
              )}
            >
              {isCompleted ? <Check className="w-5 h-5" /> : step}
            </div>
            <span className={cn(
              "absolute top-12 whitespace-nowrap text-2xs uppercase tracking-widest font-semibold",
              isActive ? "text-primary" : "text-text-tertiary"
            )}>
              {labels[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
