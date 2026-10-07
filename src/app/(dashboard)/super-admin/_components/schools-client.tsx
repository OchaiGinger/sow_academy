"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  updateSchool,
  deleteSchool,
  type School,
} from "@/app/actions/school-actions";

type Props = {
  initialSchools: School[];
};

export function SchoolsClient({ initialSchools }: Props) {
  const [query, setQuery] = useState("");
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? initialSchools.filter(
        (s) =>
          s.name.toLowerCase().includes(normalizedQuery) ||
          s.email.toLowerCase().includes(normalizedQuery) ||
          (s.principalName ?? "").toLowerCase().includes(normalizedQuery),
      )
    : initialSchools;

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this school? This action cannot be undone.")) return;

    const res = await deleteSchool(id);
    if (res.success) {
      toast.success("School deleted successfully.");
    } else {
      toast.error(res.error || "Failed to delete school.");
    }
  };

  const handleUpdate = async (data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
    motto?: string;
    principalName?: string;
    resultCardPrice?: number;
  }) => {
    if (!editingSchool) return;
    setIsSubmitting(true);
    try {
      const res = await updateSchool(editingSchool.id, data);
      if (res.success) {
        toast.success("School updated successfully.");
        setEditingSchool(null);
      } else {
        toast.error(res.error || "Failed to update school.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email or principal..."
            className="h-8 pl-8 text-xs"
          />
        </div>
        <Button className="gap-2" disabled>
          <Plus className="h-4 w-4" />
          Add School
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-bold">{filtered.length}</span> of{" "}
          <span className="font-bold">{initialSchools.length}</span> schools.
        </p>
      </div>

      <div className="grid gap-4">
        {filtered.map((school) => (
          <div
            key={school.id}
            className="rounded-xl border border-border-subtle bg-bg-surface p-4 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="font-bold text-text-primary truncate">{school.name}</h3>
                <p className="text-xs text-text-tertiary truncate">{school.email}</p>
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-text-tertiary">
                  {school.phone && <span>{school.phone}</span>}
                  {school.address && <span>• {school.address}</span>}
                  {school.website && <span>• {school.website}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {school.motto && (
                    <span className="inline-flex items-center rounded-full border border-border-subtle bg-bg-elevated px-2 py-0.5 text-[10px] font-bold text-text-secondary">
                      {school.motto}
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-full border border-border-subtle bg-bg-elevated px-2 py-0.5 text-[10px] font-bold text-text-secondary">
                    ₦{school.resultCardPrice} result card
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                  onClick={() => setEditingSchool(school)}
                  title="Edit School"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(school.id)}
                  title="Delete School"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-20 text-text-tertiary italic">
            No schools match &quot;{query}&quot;.
          </div>
        )}
      </div>

      <Sheet open={!!editingSchool} onOpenChange={(open) => !open && setEditingSchool(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="uppercase tracking-widest font-bold">
              Edit School
            </SheetTitle>
          </SheetHeader>
          {editingSchool && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold">School Name</Label>
                <Input
                  defaultValue={editingSchool.name}
                  id="edit-name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold">Email</Label>
                <Input
                  defaultValue={editingSchool.email}
                  id="edit-email"
                  type="email"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold">Phone</Label>
                  <Input defaultValue={editingSchool.phone ?? ""} id="edit-phone" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold">Website</Label>
                  <Input defaultValue={editingSchool.website ?? ""} id="edit-website" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold">Address</Label>
                <Input defaultValue={editingSchool.address ?? ""} id="edit-address" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold">Motto</Label>
                <Input defaultValue={editingSchool.motto ?? ""} id="edit-motto" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold">Principal Name</Label>
                <Input defaultValue={editingSchool.principalName ?? ""} id="edit-principal" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold">Result Card Price (₦)</Label>
                <Input
                  type="number"
                  defaultValue={editingSchool.resultCardPrice}
                  id="edit-price"
                />
              </div>
              <Button
                className="w-full"
                disabled={isSubmitting}
                onClick={async () => {
                  const data = {
                    name: (document.getElementById("edit-name") as HTMLInputElement).value,
                    email: (document.getElementById("edit-email") as HTMLInputElement).value,
                    phone: (document.getElementById("edit-phone") as HTMLInputElement).value,
                    website: (document.getElementById("edit-website") as HTMLInputElement).value,
                    address: (document.getElementById("edit-address") as HTMLInputElement).value,
                    motto: (document.getElementById("edit-motto") as HTMLInputElement).value,
                    principalName: (document.getElementById("edit-principal") as HTMLInputElement).value,
                    resultCardPrice: parseFloat((document.getElementById("edit-price") as HTMLInputElement).value),
                  };
                  await handleUpdate(data);
                }}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
