"use client";

import { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ReportHeader } from "./header";
import { AcademicRecord } from "./academic-record";
import type { ClassSubject } from "./academic-record";
import { SignatureArea } from "./signature-area";
import {
  saveStudentReport,
  principalStampSingle,
} from "@/app/actions/form-master-actions";

interface ReportCardModalProps {
  student: any;
  school: any;
  termName: string;
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
  termName,
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

  useEffect(() => {
    if (student && isOpen) {
      setIsApproved(!!student.isApproved);
      setIsStamped(!!student.isStamped);
      setFormData({
        punctuality: student.punctuality || "5",
        neatness: student.neatness || "5",
        conduct: student.conduct || "5",
        attendance: student.attendance || "",
        fmRemark: student.fmRemark || "",
      });
    }
  }, [student, isOpen]);

  if (!student) return null;

  const scoredNames = new Set(
    (student.subjects ?? []).map((s: any) => s.name.trim().toLowerCase()),
  );
  const missingSubjects = allSubjects.filter(
    (cs) => !scoredNames.has(cs.name.trim().toLowerCase()),
  );
  const hasMissingSubjects = missingSubjects.length > 0;

  const handleAction = async () => {
    if (hasMissingSubjects) {
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
        const stats = {
          average: student.average,
          totalScore: student.totalScore,
          rank: student.rank,
          termId,
        };
        const res = await saveStudentReport(student.studentId, formData, stats);
        if (res.success) {
          setIsApproved(true);
          onApproved?.(student.studentId, "approved");
          router.refresh();
        }
      }
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 border-none bg-white overflow-y-auto">
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
                Form Master's Remark
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
            {new Date(student.nextTermDate).toDateString()}
          </div>
        </div>

        {/* ── Screen-only controls ── */}
        <div className="no-print p-4 bg-slate-50 border-t flex gap-3">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Print 1-Page Report
          </Button>
          <Button onClick={handleAction} disabled={loading}>
            {loading
              ? "Saving…"
              : isPrincipal
                ? "Stamp Report"
                : "Approve & Sign"}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
