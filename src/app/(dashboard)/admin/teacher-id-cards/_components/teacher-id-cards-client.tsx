"use client";

import { flushSync } from "react-dom";
import { useReactToPrint } from "react-to-print";
import { useMemo, useRef, useState } from "react";
import { CheckSquare, Printer, Search, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type TeacherForCard = {
  id: string;
  staffId: string | null;
  user: { name: string; email: string; phone: string | null; image: string | null; role: string };
  classSubjects: { class: { name: string }; subject: { name: string } }[];
};

type SchoolBranding = { name: string; email: string; logoUrl: string | null };

const CARD_STYLE = `
.tic-card{position:relative;width:85.6mm;height:54mm;box-sizing:border-box;overflow:hidden;border:0.3mm solid #0f3d3e;border-radius:3mm;background:#fff;color:#10231f;display:flex;flex-direction:column;font-family:Arial,system-ui,sans-serif;break-inside:avoid;page-break-inside:avoid}
.tic-head{height:11mm;flex:none;display:flex;align-items:center;gap:2.5mm;padding:0 4mm;background:#0f3d3e;color:white}
.tic-logo{height:7mm;width:7mm;flex:none;display:grid;place-items:center;overflow:hidden;border-radius:50%;background:#e0a526;color:#0f3d3e;font-weight:800;font-size:9pt}
.tic-logo img{height:100%;width:100%;object-fit:contain;background:white}
.tic-school{font-size:9pt;font-weight:800;line-height:1.15}
.tic-sub{margin-top:.4mm;font-size:5.5pt;letter-spacing:.04em;opacity:.8}
.tic-body{display:flex;flex:1;min-height:0;gap:4mm;padding:3mm 4mm 0}
.tic-photo{height:25mm;width:20mm;flex:none;display:grid;place-items:center;overflow:hidden;border:0.4mm solid #e0a526;border-radius:1.5mm;background:#e8efed;color:#0f3d3e;font-size:16pt;font-weight:800}
.tic-photo img{width:100%;height:100%;object-fit:cover}
.tic-info{min-width:0;flex:1;display:flex;flex-direction:column;justify-content:center;gap:1.5mm}
.tic-name{font-size:10pt;font-weight:800;line-height:1.15;text-transform:capitalize;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.tic-field{min-width:0;display:flex;flex-direction:column;line-height:1.2}
.tic-field small{font-size:5.5pt;color:#5b716c}
.tic-field b{font-size:7.5pt;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tic-foot{height:12mm;flex:none;display:flex;align-items:flex-end;justify-content:space-between;gap:3mm;padding:1.5mm 4mm 2mm}
.tic-id{flex:1;min-width:0;font:700 6.5pt ui-monospace,monospace;letter-spacing:.06em}
.tic-role{padding:.8mm 1.6mm;border-radius:1mm;background:#f6e3b0;color:#0f3d3e;font-size:6pt;font-weight:800;white-space:nowrap}
.tic-sheet{display:grid;grid-template-columns:repeat(2,85.6mm);justify-content:center;align-content:start;column-gap:6mm;row-gap:7mm;padding:10mm 0;background:white}
.tic-sheet:not(:last-child){break-after:page;page-break-after:always}
@page{size:A4 portrait;margin:0}
`;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "")).toUpperCase();
}

function TeacherIdCard({ teacher, school }: { teacher: TeacherForCard; school: SchoolBranding }) {
  const id = teacher.staffId || teacher.user.email;
  const subjects = Array.from(new Set(teacher.classSubjects.map((entry) => entry.subject.name))).slice(0, 3).join(", ");
  const classes = Array.from(new Set(teacher.classSubjects.map((entry) => entry.class.name))).slice(0, 2).join(", ");

  return (
    <article className="tic-card">
      <header className="tic-head">
        <div className="tic-logo">
          {school.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={school.logoUrl} alt="" />
          ) : school.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="tic-school">{school.name}</div>
          <div className="tic-sub">{school.email || "Staff identity card"}</div>
        </div>
      </header>
      <div className="tic-body">
        <div className="tic-photo">
          {teacher.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={teacher.user.image} alt={`${teacher.user.name} profile`} />
          ) : initials(teacher.user.name)}
        </div>
        <div className="tic-info">
          <div className="tic-name">{teacher.user.name}</div>
          <div className="tic-field"><small>Position</small><b>{teacher.user.role.replace(/_/g, " ")}</b></div>
          <div className="tic-field"><small>Class / Subject</small><b>{classes || "—"}{subjects ? ` · ${subjects}` : ""}</b></div>
          <div className="tic-field"><small>Contact</small><b>{teacher.user.phone || teacher.user.email}</b></div>
        </div>
      </div>
      <footer className="tic-foot">
        <div className="tic-id">STAFF ID · {id}</div>
        <div className="tic-role">AUTHORIZED STAFF</div>
      </footer>
    </article>
  );
}

const PRINT_STYLE = `@page{size:A4 portrait;margin:0}html,body{margin:0;padding:0;background:#fff}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box}${CARD_STYLE}`;

export function TeacherIdCardsClient({ teachers, school }: { teachers: TeacherForCard[]; school: SchoolBranding }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [printIds, setPrintIds] = useState<string[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((teacher) =>
      [teacher.user.name, teacher.user.email, teacher.user.phone ?? "", teacher.staffId ?? ""]
        .some((value) => value.toLowerCase().includes(q)),
    );
  }, [teachers, query]);
  const allSelected = filtered.length > 0 && filtered.every((teacher) => selected.has(teacher.id));

  const reactToPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Teacher_ID_Cards",
    pageStyle: PRINT_STYLE,
    onAfterPrint: () => setPrintIds([]),
  });

  const print = (ids: string[]) => {
    if (!ids.length) {
      toast.error("Select at least one teacher to print.");
      return;
    }
    flushSync(() => setPrintIds(ids));
    reactToPrint();
  };
  const toggle = (id: string) => setSelected((previous) => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const toggleAll = () => setSelected((previous) => {
    const next = new Set(previous);
    filtered.forEach((teacher) => allSelected ? next.delete(teacher.id) : next.add(teacher.id));
    return next;
  });
  const printList = teachers.filter((teacher) => printIds.includes(teacher.id));
  const printPages = Array.from({ length: Math.ceil(printList.length / 8) }, (_, index) =>
    printList.slice(index * 8, index * 8 + 8),
  );

  return (
    <div className="space-y-4 pb-20">
      <style>{CARD_STYLE}</style>
      <section className="space-y-3 rounded-xl border bg-card p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email or staff ID" className="h-9 pl-8 text-sm" aria-label="Search teachers" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={toggleAll} className="gap-2">
              {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              {allSelected ? "Unselect shown" : "Select shown"}
            </Button>
            <Button size="sm" onClick={() => print(filtered.map((teacher) => teacher.id))} className="gap-2">
              <Printer className="h-4 w-4" /> Print all shown ({filtered.length})
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Showing {filtered.length} of {teachers.length} teachers. Cards print at standard ID size (85.6 × 54 mm), two per row on A4.</p>
      </section>

      {filtered.length ? (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(350px,1fr))]">
          {filtered.map((teacher) => (
            <div key={teacher.id} className={`rounded-xl border bg-card p-3 ${selected.has(teacher.id) ? "border-primary ring-2 ring-primary/30" : ""}`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className="flex min-w-0 cursor-pointer items-center gap-2 text-xs">
                  <input type="checkbox" checked={selected.has(teacher.id)} onChange={() => toggle(teacher.id)} className="h-4 w-4 accent-[#0f3d3e]" />
                  <span className="truncate font-medium">{teacher.user.name}</span>
                </label>
                <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2 text-xs" onClick={() => print([teacher.id])}><Printer className="h-3.5 w-3.5" /> Print card</Button>
              </div>
              <div className="flex justify-center overflow-x-auto"><TeacherIdCard teacher={teacher} school={school} /></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm font-medium">No teachers match this search.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setQuery("")}>Clear search</Button>
        </div>
      )}

      {selected.size > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-card px-3 py-2 shadow-lg sm:gap-3 sm:px-4">
          <span className="whitespace-nowrap text-sm"><b>{selected.size}</b> selected</span>
          <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => setSelected(new Set())}><X className="h-3.5 w-3.5" /> Clear</Button>
          <Button size="sm" className="h-8 gap-2" onClick={() => print(teachers.filter((teacher) => selected.has(teacher.id)).map((teacher) => teacher.id))}><Printer className="h-4 w-4" /> Print selected</Button>
        </div>
      )}

      <div aria-hidden style={{ position: "fixed", left: "-10000px", top: 0, pointerEvents: "none" }}>
        <div ref={printRef}>
          {printPages.map((page, index) => (
            <div key={index} className="tic-sheet">
              {page.map((teacher) => <TeacherIdCard key={teacher.id} teacher={teacher} school={school} />)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
