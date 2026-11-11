"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, UserPlus, Trash2 } from "lucide-react";
import { convertUserToStudent, deleteUnlinkedUser } from "@/app/actions/user-actions";

type UnlinkedUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: Date | string;
};

type ClassOption = { id: string; name: string; level: string; arm: string };

export function UsersClient({
  users,
  classes,
}: {
  users: UnlinkedUser[];
  classes: ClassOption[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [converting, setConverting] = useState<UnlinkedUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [classId, setClassId] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "">("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [address, setAddress] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.name, u.email, u.role, u.phone ?? ""].some((f) => f.toLowerCase().includes(q)),
    );
  }, [users, query]);

  const openConvert = (user: UnlinkedUser) => {
    setConverting(user);
    setClassId("");
    setGender("");
    setDateOfBirth("");
    setGuardianName("");
    setGuardianPhone(user.phone ?? "");
    setAddress("");
  };

  const handleConvert = async () => {
    if (!converting) return;
    if (!classId || !gender || !dateOfBirth || !guardianName || !guardianPhone) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await convertUserToStudent({
        userId: converting.id,
        classId,
        gender,
        dateOfBirth,
        guardianName,
        guardianPhone,
        address,
      });

      if (res.success) {
        toast.success(`Converted to student. Admission No: ${res.admissionNo}`);
        setConverting(null);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to convert user.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user: UnlinkedUser) => {
    if (!confirm(`Delete user "${user.name}" (${user.email})? This cannot be undone.`)) return;
    setDeletingId(user.id);
    const res = await deleteUnlinkedUser(user.id);
    setDeletingId(null);
    if (res.success) {
      toast.success("User deleted.");
      router.refresh();
    } else {
      toast.error(res.error || "Failed to delete user.");
    }
  };

  return (
    <>
      <div className="border-b bg-card px-4 py-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, role..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="w-full min-w-[700px]">
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">User</TableHead>
              <TableHead className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Role</TableHead>
              <TableHead className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Phone</TableHead>
              <TableHead className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Created</TableHead>
              <TableHead className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                  {users.length === 0 ? "No unlinked users found." : `No users match "${query}".`}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="px-4 py-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Badge variant="outline" className="text-[10px] font-bold uppercase">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-xs text-muted-foreground">
                    {user.phone || "—"}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-xs text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("en-GB")}
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1"
                        onClick={() => openConvert(user)}
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Make Student
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        disabled={deletingId === user.id || user.role === "ADMIN"}
                        onClick={() => handleDelete(user)}
                        title={user.role === "ADMIN" ? "Cannot delete admin" : "Delete user"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!converting} onOpenChange={(open) => !open && setConverting(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Convert to Student</SheetTitle>
          </SheetHeader>
          {converting && (
            <div className="mt-6 space-y-4">
              <div className="rounded-md bg-muted/50 p-3">
                <p className="font-semibold text-sm">{converting.name}</p>
                <p className="text-xs text-muted-foreground">{converting.email}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold">Class</Label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold">Gender</Label>
                <Select value={gender} onValueChange={(v) => setGender(v as "MALE" | "FEMALE")}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold">Date of Birth</Label>
                <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold">Guardian Name</Label>
                <Input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="Guardian full name" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold">Guardian Phone</Label>
                <Input value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} placeholder="080..." />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold">Address (optional)</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Home address" />
              </div>

              <Button className="w-full" onClick={handleConvert} disabled={isSubmitting}>
                {isSubmitting ? "Converting..." : "Convert to Student"}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
