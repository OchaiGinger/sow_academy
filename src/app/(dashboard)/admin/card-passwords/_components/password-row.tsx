"use client";

import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Check, Loader2 } from "lucide-react";
import { setClassPassword } from "@/app/actions/password-actions"; // We will create this next
import { toast } from "sonner"; // Or your preferred toast library

interface PasswordRowProps {
  classId: string;
  className: string;
  termId: string;
  initialPassword: string;
}

export function PasswordRow({
  classId,
  className,
  termId,
  initialPassword,
}: PasswordRowProps) {
  const [password, setPassword] = useState(initialPassword);
  const [isPending, setIsPending] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  async function handleSave() {
    setIsPending(true);
    try {
      await setClassPassword(termId, classId, password);
      setIsSaved(true);
      toast.success(`Password updated for ${className}`);

      // Reset the "Saved" checkmark after 2 seconds
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      toast.error("Failed to update password");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{className}</TableCell>
      <TableCell>
        <Input
          placeholder="Enter password..."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="max-w-[200px]"
        />
      </TableCell>
      <TableCell>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isPending || password === initialPassword}
          variant={isSaved ? "outline" : "default"}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isSaved ? (
            <Check className="h-4 w-4 text-emerald-500" />
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save
            </>
          )}
        </Button>
      </TableCell>
    </TableRow>
  );
}
