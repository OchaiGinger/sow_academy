"use client";

import { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ReportHeader } from "./header";
import { AcademicRecord } from "./academic-record";
import type { ClassSubject } from "./academic-record";
import { SignatureArea } from "./signature-area";
import type { ReportSchool, ReportStudent } from "./report-card-types";
import {
  saveStudentReport,
  principalStampSingle,
} from "@/app/actions/form-master-actions";

interface ReportCardModalProps {
  student: ReportStudent | null;
  school: ReportSchool | null;
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  termId: string;
  onApproved?: (studentId: string, action: "approved" | "stamped") => void;
  allSubjects: ClassSubject[];
}

export function ReportCardModal({
  student,
  school,
  isOpen,
  onClose,
  userRole,
  termId,
  onApproved,
  allSubjects,
}: ReportCardModalProps) {
  const [loading, setLoading] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isStamped, setIsStamped] = useState(false);
  const isPrincipal = userRole === "PRINCIPAL";
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    punctuality: "5",
    neatness: "5",
    conduct: "5",
    attendance: "",
    fmRemark: "",
  });

  const normalizeRating = (value: string | null | undefined) => {
    const score = Number(value);
    return Number.isInteger(score) && score >= 1 && score <= 10 ? String(score) : "5";
  };

  useEffect(() => {
    if (student && isOpen) {
      setIsApproved(!!student.isApproved);
      setIsStamped(!!student.isStamped);
      setFormData({
        punctuality: normalizeRating(student.punctuality),
        neatness: normalizeRating(student.neatness),
        conduct: normalizeRating(student.conduct),
        attendance: /^\d{1,3}\s*\/\s*\d{1,3}$/.test(student.attendance || "") ? student.attendance || "" : "",
        fmRemark: student.fmRemark || "",
      });
    }
  }, [student, isOpen]);

  const scoredNames = new Set(
    student?.subjects.map((s) => s.name.trim().toLowerCase()) ?? [],
  );
  const missingSubjects = allSubjects.filter((cs) =>
    !scoredNames.has(cs.name.trim().toLowerCase()),
  );
  const hasMissingSubjects = missingSubjects.length > 0;

  const handleAction = async (approve = false) => {
    if (!student) return;
    if (approve && hasMissingSubjects) {
      toast.error("Complete scores before signing.");
      return;
    }
    setLoading(true);
    try {
      if (isPrincipal) {
        const res = await principalStampSingle(student.studentId, termId);
        if (res.success) {
          setIsStamped(true);
          onApproved?.(student.studentId, "stamped");
          router.refresh();
        }
      } else {
        const stats = { termId, approve };
        const res = await saveStudentReport(student.studentId, formData, stats);
        if (res.success) {
          setIsApproved(approve);
          if (approve) onApproved?.(student.studentId, "approved");
          toast.success(approve ? "Report approved and signed." : "Behaviour and remark saved.");
          router.refresh();
        } else {
          toast.error(res.error || "Unable to save the report.");
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save this report.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Report_Card_${student?.name}`,
    print: async (printIframe: HTMLIFrameElement) => {
      const document = printIframe.contentDocument;
      if (document) {
        const style = document.createElement("style");
        style.innerHTML = `
          @page {
            size: A4 portrait;
            margin: 5mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: white !important;
            font-size: 10px;
          }
          /* ── Header ── */
          .print-header-wrap {
            padding: 3mm 5mm 2mm !important;
          }
          .print-logo {
            width: 44px !important;
            height: 44px !important;
          }
          .print-badge {
            width: 52px !important;
            height: 52px !important;
          }
          /* ── Table ── */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
            font-size: 6.5pt !important;
            line-height: 1 !important;
          }
          thead tr th {
            padding: 1.5px 2px !important;
            font-size: 6pt !important;
            line-height: 1 !important;
          }
          tbody tr td {
            padding: 1.5px 2px !important;
            font-size: 6.5pt !important;
            line-height: 1 !important;
          }
          /* ── Section gaps ── */
          .print-section-gap { margin-top: 4px !important; }
          .print-grid-gap    { gap: 5px !important; margin-top: 4px !important; }
          /* ── Cards ── */
          .print-card          { padding: 3px 5px !important; border-radius: 3px !important; }
          .print-card h4       { font-size: 6pt !important; margin-bottom: 1px !important; }
          .print-card p,
          .print-card span,
          .print-card li       { font-size: 6.5pt !important; line-height: 1.2 !important; }
          /* ── Signatures ── */
          .print-sig           { margin-top: 4px !important; padding-top: 2px !important; font-size: 6pt !important; gap: 5px !important; }
          /* ── Footer ── */
          .print-footer        { margin-top: 2px !important; padding-top: 2px !important; font-size: 6pt !important; }
          /* hide screen-only elements */
          .no-print, .print\\:hidden { display: none !important; }
        `;
        document.head.appendChild(style);
      }
      printIframe.contentWindow?.print();
    },
  });

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[92dvh] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-y-auto border-2 border-black bg-white p-0 sm:w-[95vw]">
        {!isPrincipal && (
          <section className="no-print mx-4 mt-4 rounded-xl border-2 border-black bg-white p-4 text-black sm:mx-8 sm:p-5">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-base font-black text-black">Form master assessment</h3>
                <p className="text-sm font-medium text-gray-700">Edit behaviour ratings and your comment before approving the report.</p>
              </div>
              {isStamped && <span className="w-fit rounded-full border-2 border-black px-3 py-1 text-xs font-black">Locked after principal stamp</span>}
              {isApproved && !isStamped && <span className="w-fit rounded-full border-2 border-black px-3 py-1 text-xs font-black">Editing will require re-approval</span>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {([
                ["punctuality", "Punctuality"],
                ["neatness", "Neatness"],
                ["conduct", "Conduct"],
              ] as const).map(([field, label]) => (
                <label key={field} className="space-y-1.5 text-sm font-bold text-black">
                  <span>{label} (1–10)</span>
                  <select
                    value={formData[field]}
                    onChange={(event) => setFormData((previous) => ({ ...previous, [field]: event.target.value }))}
                    disabled={loading || isStamped}
                    className="h-11 w-full rounded-md border-2 border-black bg-white px-3 font-bold text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:bg-gray-100"
                  >
                    {Array.from({ length: 10 }, (_, index) => String(index + 1)).map((score) => (
                      <option key={score} value={score}>{score} / 10</option>
                    ))}
                  </select>
                </label>
              ))}
              <label className="space-y-1.5 text-sm font-bold text-black">
                <span>Attendance (days present / total days)</span>
                <Input
                  value={formData.attendance}
                  onChange={(event) => setFormData((previous) => ({ ...previous, attendance: event.target.value }))}
                  placeholder="e.g. 84/90"
                  maxLength={20}
                  disabled={loading || isStamped}
                  className="h-11 border-2 border-black bg-white font-semibold text-black placeholder:text-gray-600 focus-visible:ring-black"
                />
              </label>
              <label className="space-y-1.5 text-sm font-bold text-black sm:col-span-2">
                <span>Form master&apos;s remark</span>
                <Textarea
                  value={formData.fmRemark}
                  onChange={(event) => setFormData((previous) => ({ ...previous, fmRemark: event.target.value }))}
                  placeholder="Add a helpful comment about the student's progress…"
                  maxLength={1500}
                  rows={4}
                  disabled={loading || isStamped}
                  className="min-h-28 resize-y border-2 border-black bg-white font-medium text-black placeholder:text-gray-600 focus-visible:ring-black"
                />
                <span className="block text-right text-xs font-semibold text-gray-700">{formData.fmRemark.length}/1500</span>
              </label>
            </div>
          </section>
        )}

        {/* ── Printable area ── */}
        <div
          ref={printRef}
          className="bg-white text-slate-900 p-4 sm:p-8 print:p-0 w-full mx-auto"
        >
          {/* Header */}
          <ReportHeader school={school} student={student} />

          {/* Academic table */}
          <div className="mt-4 print-section-gap">
            <AcademicRecord
              subjects={student.subjects}
              allSubjects={allSubjects}
            />
          </div>

          {/* Behavioural + Remarks — side by side */}
          <div className="grid grid-cols-2 gap-3 mt-4 print-grid-gap">
            {/* Behavioural */}
            <div className="print-card border rounded-lg p-3">
              <h4 className="text-[10px] font-black uppercase mb-1.5 print:text-[6pt] print:mb-0.5">
                Behavioural Assessment
              </h4>
              <div className="space-y-1 print:space-y-0">
                {[
                  { label: "Punctuality", value: formData.punctuality },
                  { label: "Neatness", value: formData.neatness },
                  { label: "Conduct", value: formData.conduct },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between text-[10px] print:text-[6.5pt]"
                  >
                    <span className="text-slate-600 font-medium">{label}</span>
                    <span className="font-black text-slate-900">
                      {value}/10
                    </span>
                  </div>
                ))}
                {formData.attendance && (
                  <div className="flex items-center justify-between text-[10px] print:text-[6.5pt]">
                    <span className="text-slate-600 font-medium">
                      Days Present
                    </span>
                    <span className="font-black text-slate-900">
                      {formData.attendance}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Form Master's Remark */}
            <div className="print-card border rounded-lg p-3">
              <h4 className="text-[10px] font-black uppercase mb-1.5 print:text-[6pt] print:mb-0.5">
                Form Master&apos;s Remark
              </h4>
              <p className="text-[10px] print:text-[6.5pt] text-slate-700 leading-snug">
                {formData.fmRemark || "—"}
              </p>
            </div>
          </div>

          {/* Signature area */}
          <div className="print-sig">
            <SignatureArea
              isApproved={isApproved}
              isStamped={isStamped}
              school={school}
              student={student}
            />
          </div>

          {/* Next term footer */}
          <div className="print-footer mt-3 text-[9px] print:text-[6pt] text-center border-t pt-1.5">
            <span className="font-semibold">Next Term Begins:</span>{" "}
             {student.nextTermDate
                ? new Date(student.nextTermDate).toDateString()
                : "To Be Announced"}
          </div>
        </div>

        {/* ── Screen-only controls ── */}
        <div className="no-print sticky bottom-0 flex flex-wrap gap-3 border-t-2 border-black bg-white p-4">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Print 1-Page Report
          </Button>
          {isPrincipal ? (
            <Button onClick={() => handleAction()} disabled={loading || !isApproved || isStamped} className="font-bold">
              {loading ? "Applying stamp…" : isStamped ? "Already stamped" : "Stamp Report"}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleAction(false)} disabled={loading || isStamped} className="border-2 border-black font-bold text-black">
                {loading ? "Saving…" : "Save assessment"}
              </Button>
              <Button onClick={() => handleAction(true)} disabled={loading || isStamped} className="font-bold">
                {loading ? "Saving…" : isApproved ? "Update & approve" : "Approve & sign"}
              </Button>
            </>
          )}
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
