// components/student/print-button.tsx
"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button
      onClick={() => window.print()}
      className="flex items-center gap-2 bg-gray-800 text-white hover:bg-gray-900 font-bold uppercase text-xs tracking-wider"
    >
      <Printer className="w-4 h-4" />
      Print / Save as PDF
    </Button>
  );
}
