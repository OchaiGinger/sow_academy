"use client";

import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, Search } from "lucide-react";
import { useState, useRef, useMemo } from "react";
import { toast } from "sonner";

type StudentForCard = {
  id: string;
  admissionNo: string;
  user: { name: string; email: string };
  class: { name: string; level: string; arm: string } | null;
};

export function IdCardsClient({ students }: { students: StudentForCard[] }) {
  const [query, setQuery] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? students.filter(
        (s) =>
          s.user.name.toLowerCase().includes(normalizedQuery) ||
          s.admissionNo.toLowerCase().includes(normalizedQuery) ||
          s.user.email.toLowerCase().includes(normalizedQuery) ||
          (s.class?.name ?? "").toLowerCase().includes(normalizedQuery),
      )
    : students;

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Student_ID_Cards",
    print: async (printIframe) => {
      const document = printIframe.contentDocument;
      if (document) {
        const style = document.createElement("style");
        style.innerHTML = `
          @page {
            size: A4 landscape;
            margin: 8mm;
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
          }
          .id-card-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10mm;
            padding: 5mm;
          }
          .id-card {
            width: 100%;
            aspect-ratio: 1.6 / 1;
            border: 2px solid #1e293b;
            border-radius: 8px;
            padding: 8mm;
            display: flex;
            flex-direction: column;
            page-break-inside: avoid;
            background: white;
          }
          .id-card-header {
            text-align: center;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
            margin-bottom: 6px;
          }
          .id-card-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 6px;
          }
          .id-card-photo {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: #94a3b8;
          }
          .id-card-name {
            font-weight: 700;
            font-size: 14px;
            text-align: center;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .id-card-details {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 3px;
            margin-top: 6px;
            font-size: 10px;
            color: #334155;
          }
          .id-card-details div {
            display: flex;
            justify-content: space-between;
          }
          .id-card-details span:first-child {
            font-weight: 600;
            color: #64748b;
          }
          .id-card-footer {
            margin-top: auto;
            border-top: 1px solid #e2e8f0;
            padding-top: 5px;
            text-align: center;
            font-size: 8px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .no-print { display: none !important; }
        `;
        document.head.appendChild(style);
      }
      printIframe.contentWindow?.print();
    },
  });

  const handlePrintAll = async () => {
    if (filtered.length === 0) {
      toast.error("No ID cards to print.");
      return;
    }
    handlePrint();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, admission no, email or class..."
            className="h-8 pl-8 text-xs"
          />
        </div>
        <Button onClick={handlePrintAll} className="gap-2">
          <Printer className="h-4 w-4" />
          Print All ID Cards
        </Button>
      </div>

      <div className="no-print rounded-xl border bg-card p-4">
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-bold">{filtered.length}</span> of{" "}
          <span className="font-bold">{students.length}</span> students.
          Click &quot;Print All ID Cards&quot; to print 2 cards per A4 landscape page.
        </p>
      </div>

      <div ref={printRef} className="id-card-grid">
        {filtered.map((s) => (
          <div key={s.id} className="id-card">
            <div className="id-card-header">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                SOWA Academy
              </div>
              <div className="text-[7px] uppercase tracking-wider text-slate-500">
                Student Identity Card
              </div>
            </div>

            <div className="id-card-body">
              <div className="id-card-photo">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="id-card-name">{s.user.name}</div>
            </div>

            <div className="id-card-details">
              <div>
                <span>Adm No:</span>
                <span className="font-mono">{s.admissionNo}</span>
              </div>
              <div>
                <span>Class:</span>
                <span>{s.class?.name ?? "—"}</span>
              </div>
              <div>
                <span>Email:</span>
                <span className="truncate ml-2">{s.user.email}</span>
              </div>
            </div>

            <div className="id-card-footer">
              2025/2026 Session
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-text-tertiary italic">
          No students match &quot;{query}&quot;.
        </div>
      )}
    </div>
  );
}
