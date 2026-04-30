"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FormMasterForm } from "./form-master-form";

interface AddFormMasterButtonProps {
  teachers: { id: string; name: string }[];
  classes: { id: string; name: string }[];
}

export function AddFormMasterButton({
  teachers,
  classes,
}: AddFormMasterButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Assign Form Master
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Assign Form Master</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <FormMasterForm
            teachers={teachers}
            classes={classes}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
