"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createTerm,
  updateTerm,
  type TermFormData,
} from "@/app/actions/session-action";
import { TermName } from "@prisma/client";

interface TermFormProps {
  sessionId: string;
  onSuccess: () => void;
  initial?: { id: string } & TermFormData;
}

export function TermForm({ sessionId, onSuccess, initial }: TermFormProps) {
  const [name, setName] = useState<TermName>(initial?.name ?? TermName.FIRST);
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [nextTermDate, setNextTermDate] = useState(initial?.nextTermDate ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const data: TermFormData = { name, startDate, endDate, nextTermDate };
      if (initial) {
        await updateTerm(initial.id, data);
      } else {
        await createTerm(sessionId, data);
      }
      onSuccess();
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Term</Label>
        <Select value={name} onValueChange={(v) => setName(v as TermName)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TermName.FIRST}>First Term</SelectItem>
            <SelectItem value={TermName.SECOND}>Second Term</SelectItem>
            <SelectItem value={TermName.THIRD}>Third Term</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Start Date</Label>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>End Date</Label>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Next Term Begins</Label>
        <Input
          type="date"
          value={nextTermDate}
          onChange={(e) => setNextTermDate(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={handleSubmit} disabled={loading} className="w-full">
        {loading ? "Saving..." : initial ? "Update Term" : "Add Term"}
      </Button>
    </div>
  );
}
