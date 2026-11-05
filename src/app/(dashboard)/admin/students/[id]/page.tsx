import { db } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, Calendar, MapPin, GraduationCap, Shield } from "lucide-react";
import { format } from "date-fns";

export default async function AdminStudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    redirect("/login");
  }

  const { id } = await params;

  const student = await db.student.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true, image: true, createdAt: true } },
      class: true,
      scores: {
        include: {
          classSubject: { include: { subject: true } },
          term: true,
        },
        orderBy: { term: { startDate: "desc" } },
      },
      termResults: {
        include: { term: true },
        orderBy: { term: { startDate: "desc" } },
      },
    },
  });

  if (!student) {
    return <div className="p-8 text-center">Student not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Header with Photo */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-slate-900 px-6 py-8 flex flex-col md:flex-row md:items-center gap-6">
          {/* Student Photo */}
          <div className="flex-shrink-0">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white/20 overflow-hidden bg-muted/30 flex items-center justify-center">
              {student.user.image ? (
                <img
                  src={student.user.image}
                  alt={`${student.user.name}'s passport`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-5xl md:text-6xl font-bold text-white/50">
                  {student.user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Student Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {student.user.name}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
              <Badge className="bg-white/10 text-white border-white/20 font-mono text-xs">
                {student.admissionNo}
              </Badge>
              <Badge className="bg-primary/20 text-primary border-primary/30 font-mono text-xs">
                {student.class?.name || "Unassigned"}
              </Badge>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-mono text-xs">
                {student.gender || "—"}
              </Badge>
            </div>
          </div>

          {/* Role Badge */}
          <div className="flex-shrink-0">
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 px-4 py-2 text-sm">
              <Shield className="w-3 h-3 mr-1" />
              STUDENT
            </Badge>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Personal Information</h3>
            <dl className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <dt className="text-xs text-slate-400">Email</dt>
                  <dd className="font-medium text-slate-900">{student.user.email}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <dt className="text-xs text-slate-400">Phone</dt>
                  <dd className="font-medium text-slate-900">{student.user.phone || "—"}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <dt className="text-xs text-slate-400">Date of Birth</dt>
                  <dd className="font-medium text-slate-900">
                    {student.dateOfBirth ? format(new Date(student.dateOfBirth), "PPP") : "—"}
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <dt className="text-xs text-slate-400">Address</dt>
                  <dd className="font-medium text-slate-900">{student.address || "—"}</dd>
                </div>
              </div>
            </dl>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Guardian Information</h3>
            <dl className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <dt className="text-xs text-slate-400">Guardian Name</dt>
                  <dd className="font-medium text-slate-900">{student.guardianName || "—"}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <dt className="text-xs text-slate-400">Guardian Phone</dt>
                  <dd className="font-medium text-slate-900">{student.guardianPhone || "—"}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <dt className="text-xs text-slate-400">Class</dt>
                  <dd className="font-medium text-slate-900">
                    {student.class?.name || "Unassigned"} ({student.class?.level || "—"} {student.class?.arm || "—"})
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <dt className="text-xs text-slate-400">Admitted</dt>
                  <dd className="font-medium text-slate-900">
                    {format(student.user.createdAt, "PPP")}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Academic Records */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Academic Records</h2>
        </div>
        <div className="p-6">
          {student.termResults.length > 0 ? (
            <div className="space-y-4">
              {student.termResults.map((result) => {
                // Calculate total students in class for this term
                const totalInClass = student.class ? 
                  student.class.students?.length || 0 : 0;
                
                return (
                  <div key={result.id} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                      <div>
                        <h3 className="font-bold text-slate-900">{result.term.name} Term</h3>
                        <p className="text-sm text-slate-500">
                          Average: {result.average?.toFixed(1)}% | Rank: {result.rank || "—"} / {totalInClass || "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.isApproved && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                            Approved
                          </Badge>
                        )}
                        {result.isStamped && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                            Stamped
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">No academic records found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
