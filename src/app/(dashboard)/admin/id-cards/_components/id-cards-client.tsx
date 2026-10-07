"use client";

import { useReactToPrint } from "react-to-print";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, Search, X, CheckSquare, Square } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

/* -------------------------------------------------------------------------- */
/*  Config: change these in one place                                         */
/* -------------------------------------------------------------------------- */

const SESSION_LABEL = "2025/2026";

type SchoolBranding = {
  name: string;
  email: string;
  logoUrl: string | null;
};

type StudentForCard = {
  id: string;
  admissionNo: string;
  photoUrl?: string | null; // optional: shows automatically if your model has it
  user: { name: string; email: string };
  class: { name: string; level: string; arm: string } | null;
};

type PerPage = 8 | 10;

/* -------------------------------------------------------------------------- */
/*  Code 39 barcode (real, scannable)                                         */
/* -------------------------------------------------------------------------- */

// 9 elements per character: bar, space, bar, space, bar, space, bar, space, bar.
// n = narrow, w = wide.
const CODE39: Record<string, string> = {
  "0": "nnnwwnwnn", "1": "wnnwnnnnw", "2": "nnwwnnnnw", "3": "wnwwnnnnn",
  "4": "nnnwwnnnw", "5": "wnnwwnnnn", "6": "nnwwwnnnn", "7": "nnnwnnwnw",
  "8": "wnnwnnwnn", "9": "nnwwnnwnn", A: "wnnnnwnnw", B: "nnwnnwnnw",
  C: "wnwnnwnnn", D: "nnnnwwnnw", E: "wnnnwwnnn", F: "nnwnwwnnn",
  G: "nnnnnwwnw", H: "wnnnnwwnn", I: "nnwnnwwnn", J: "nnnnwwwnn",
  K: "wnnnnnnww", L: "nnwnnnnww", M: "wnwnnnnwn", N: "nnnnwnnww",
  O: "wnnnwnnwn", P: "nnwnwnnwn", Q: "nnnnnnwww", R: "wnnnnnwwn",
  S: "nnwnnnwwn", T: "nnnnwnwwn", U: "wwnnnnnnw", V: "nwwnnnnnw",
  W: "wwwnnnnnn", X: "nwnnwnnnw", Y: "wwnnwnnnn", Z: "nwwnwnnnn",
  "-": "nwnnnnwnw", ".": "wwnnnnwnn", " ": "nwwnnnwnn", "*": "nwnnwnwnn",
  $: "nwnwnwnnn", "/": "nwnwnnnwn", "+": "nwnnnwnwn", "%": "nnnwnwnwn",
};

function Code39({ value }: { value: string }) {
  const clean = value
    .toUpperCase()
    .split("")
    .map((c) => (CODE39[c] && c !== "*" ? c : "-"))
    .join("");
  const text = `*${clean}*`;

  const bars: { x: number; w: number }[] = [];
  let x = 0;
  for (const ch of text) {
    const pattern = CODE39[ch];
    for (let i = 0; i < 9; i++) {
      const w = pattern[i] === "w" ? 3 : 1;
      if (i % 2 === 0) bars.push({ x, w });
      x += w;
    }
    x += 1; // gap between characters
  }
  const total = x - 1;
  const quiet = 10;

  return (
    <svg
      viewBox={`${-quiet} 0 ${total + quiet * 2} 1`}
      preserveAspectRatio="none"
      aria-label={`Barcode for ${clean}`}
      role="img"
    >
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={1} fill="#0b1f1c" />
      ))}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Card + print styles (physical CR80 size: 85.6 x 54 mm)                    */
/* -------------------------------------------------------------------------- */

const CARD_CSS = `
.idc-card{position:relative;width:85.6mm;height:54mm;box-sizing:border-box;border-radius:3mm;overflow:hidden;background:#fff;border:0.25mm solid #0f3d3e;display:flex;flex-direction:column;font-family:"Inter",system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#10231f;break-inside:avoid;page-break-inside:avoid;text-align:left}
.idc-mark{position:absolute;left:0;right:0;top:11mm;bottom:0;display:flex;align-items:center;justify-content:center;z-index:0;pointer-events:none}
.idc-mark img{width:34mm;height:34mm;object-fit:contain;opacity:.09;filter:grayscale(1)}
.idc-mark i{font-style:normal;font-weight:900;font-size:60pt;color:#0f3d3e;opacity:.06;line-height:1}
.idc-head,.idc-body,.idc-foot{position:relative;z-index:1}
.idc-head{height:11mm;flex:none;background:#0f3d3e;color:#fff;display:flex;align-items:center;gap:2.5mm;padding:0 4mm}
.idc-crest{width:7mm;height:7mm;flex:none;border-radius:50%;background:#e0a526;color:#0f3d3e;font-weight:800;font-size:9pt;display:flex;align-items:center;justify-content:center;overflow:hidden}
.idc-crest img{width:100%;height:100%;object-fit:contain;background:#fff;display:block}
.idc-school{font-weight:800;font-size:9.5pt;letter-spacing:.02em;line-height:1.1}
.idc-sub{font-size:5.5pt;opacity:.8;letter-spacing:.06em;margin-top:.3mm}
.idc-body{flex:1;min-height:0;display:flex;gap:4mm;padding:3mm 4mm 0}
.idc-photo{width:20mm;height:24mm;flex:none;border-radius:1.5mm;border:0.4mm solid #e0a526;background:#e8efed;color:#0f3d3e;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16pt;overflow:hidden}
.idc-photo img{width:100%;height:100%;object-fit:cover;display:block}
.idc-info{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:1.4mm}
.idc-row{display:flex;gap:3mm}
.idc-field{min-width:0}
.idc-name{font-weight:800;font-size:10pt;line-height:1.15;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-transform:capitalize}
.idc-field{display:flex;flex-direction:column;line-height:1.2}
.idc-field small{font-size:5.5pt;color:#5b716c}
.idc-field b{font-size:8pt;font-weight:650}
.idc-field.idc-email b{font-size:6.5pt;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}
.idc-foot{height:12mm;flex:none;padding:1.5mm 4mm 2mm;display:flex;align-items:flex-end;gap:3mm}
.idc-barcode{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:.4mm}
.idc-barcode svg{width:100%;height:6mm;display:block}
.idc-barcode span{font-size:5.5pt;letter-spacing:.15em;font-family:ui-monospace,Menlo,Consolas,monospace}
.idc-session{font-size:6pt;font-weight:700;color:#0f3d3e;background:#f6e3b0;border-radius:1mm;padding:.8mm 1.6mm;white-space:nowrap}

.idc-sheet{display:grid;grid-template-columns:repeat(2,85.6mm);justify-content:center;align-content:start;column-gap:6mm;background:#fff}
.idc-sheet[data-per="8"]{row-gap:7mm;padding:10mm 0}
.idc-sheet[data-per="10"]{row-gap:2mm;padding:8mm 0}
.idc-sheet:not(:last-child){break-after:page;page-break-after:always}
`;

const PRINT_PAGE_STYLE = `
@page{size:A4 portrait;margin:0}
html,body{margin:0;padding:0;background:#fff}
*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box}
${CARD_CSS}
`;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function IdCard({
  student,
  school,
  logo,
}: {
  student: StudentForCard;
  school: SchoolBranding;
  logo?: string;
}) {
  return (
    <div className="idc-card">
      <div className="idc-mark" aria-hidden>
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" />
        ) : (
          <i>{school.name.charAt(0)}</i>
        )}
      </div>
      <div className="idc-head">
        <div className="idc-crest">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" />
          ) : (
            school.name.charAt(0)
          )}
        </div>
        <div>
          <div className="idc-school">{school.name}</div>
          <div className="idc-sub">{school.email || "Student identity card"}</div>
        </div>
      </div>

      <div className="idc-body">
        <div className="idc-photo">
          {student.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={student.photoUrl} alt="" />
          ) : (
            initials(student.user.name)
          )}
        </div>
        <div className="idc-info">
          <div className="idc-name">{student.user.name.toLowerCase()}</div>
          <div className="idc-row">
            <div className="idc-field">
              <small>Class</small>
              <b>{student.class?.name ?? "Not assigned"}</b>
            </div>
            <div className="idc-field">
              <small>Admission no.</small>
              <b>{student.admissionNo}</b>
            </div>
          </div>
          <div className="idc-field idc-email">
            <small>Email</small>
            <b>{student.user.email}</b>
          </div>
        </div>
      </div>

      <div className="idc-foot">
        <div className="idc-barcode">
          <Code39 value={student.admissionNo} />
          <span>{student.admissionNo}</span>
        </div>
        <div className="idc-session">{SESSION_LABEL}</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Screen                                                                    */
/* -------------------------------------------------------------------------- */

export function IdCardsClient({
  students,
  school,
}: {
  students: StudentForCard[];
  school: SchoolBranding;
}) {
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [perPage, setPerPage] = useState<PerPage>(8);
  const [printIds, setPrintIds] = useState<string[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  const logo = school.logoUrl ?? undefined;

  const classNames = useMemo(
    () =>
      Array.from(
        new Set(students.map((s) => s.class?.name).filter((n): n is string => !!n)),
      ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    [students],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      if (classFilter === "none" && s.class) return false;
      if (classFilter !== "all" && classFilter !== "none" && s.class?.name !== classFilter)
        return false;
      if (!q) return true;
      return (
        s.user.name.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        s.user.email.toLowerCase().includes(q) ||
        (s.class?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [students, query, classFilter]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((s) => selected.has(s.id));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAllFiltered = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) filtered.forEach((s) => next.delete(s.id));
      else filtered.forEach((s) => next.add(s.id));
      return next;
    });

  /* ---- printing ---- */

  const reactToPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Student_ID_Cards",
    pageStyle: PRINT_PAGE_STYLE,
    onAfterPrint: () => setPrintIds([]),
  });

  const print = (ids: string[]) => {
    if (ids.length === 0) {
      toast.error("Select at least one student to print.");
      return;
    }
    // Render the cards first, then open the print dialog.
    flushSync(() => setPrintIds(ids));
    reactToPrint();
  };

  const printSelected = () =>
    print(students.filter((s) => selected.has(s.id)).map((s) => s.id));
  const printAllInView = () => print(filtered.map((s) => s.id));
  const printOne = (id: string) => print([id]);

  const printPages = useMemo(() => {
    const ids = new Set(printIds);
    const list = students.filter((s) => ids.has(s.id));
    const pages: StudentForCard[][] = [];
    for (let i = 0; i < list.length; i += perPage) pages.push(list.slice(i, i + perPage));
    return pages;
  }, [printIds, students, perPage]);

  return (
    <div className="space-y-4 pb-24">
      <style>{CARD_CSS}</style>

      {/* Toolbar */}
      <div className="rounded-xl border bg-card p-3 space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, admission no, email or class"
                className="h-9 pl-8 text-sm"
                aria-label="Search students"
              />
            </div>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              aria-label="Filter by class"
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="all">All classes</option>
              {classNames.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="none">No class assigned</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className="inline-flex rounded-md border p-0.5 text-xs"
              role="group"
              aria-label="Cards per page"
            >
              {([8, 10] as PerPage[]).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPerPage(n)}
                  aria-pressed={perPage === n}
                  className={`rounded px-2.5 py-1.5 transition-colors ${
                    perPage === n
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n} per page
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={toggleAllFiltered} className="gap-2">
              {allFilteredSelected ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {allFilteredSelected ? "Unselect shown" : "Select shown"}
            </Button>
            <Button size="sm" onClick={printAllInView} className="gap-2">
              <Printer className="h-4 w-4" />
              Print all shown ({filtered.length})
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
          <span className="font-semibold text-foreground">{students.length}</span> students.
          Tick cards to print a batch, or use Print card on any card for one student. Cards
          print at ID size (85.6 × 54 mm), {perPage} per A4 page.
        </p>
      </div>

      {/* Collection */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(350px,1fr))]">
          {filtered.map((s) => {
            const isSelected = selected.has(s.id);
            return (
              <div
                key={s.id}
                className={`rounded-xl border bg-card p-3 transition-shadow ${
                  isSelected ? "border-primary ring-2 ring-primary/30" : ""
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label className="flex min-w-0 cursor-pointer items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(s.id)}
                      className="h-4 w-4 accent-[#0f3d3e]"
                    />
                    <span className="truncate font-medium">{s.user.name}</span>
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 px-2 text-xs"
                    onClick={() => printOne(s.id)}
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print card
                  </Button>
                </div>
                <div
                  className="flex cursor-pointer justify-center overflow-x-auto"
                  onClick={() => toggle(s.id)}
                >
                  <IdCard student={s} school={school} logo={logo} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm font-medium">No students match this search.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Clear the search or choose a different class.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              setQuery("");
              setClassFilter("all");
            }}
          >
            Reset filters
          </Button>
        </div>
      )}

      {/* Selection bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border bg-card px-4 py-2 shadow-lg">
          <span className="text-sm">
            <span className="font-semibold">{selected.size}</span> selected
          </span>
          <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => setSelected(new Set())}>
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
          <Button size="sm" className="h-8 gap-2" onClick={printSelected}>
            <Printer className="h-4 w-4" />
            Print selected
          </Button>
        </div>
      )}

      {/* Off-screen print target: only rendered when something is being printed */}
      <div
        aria-hidden
        style={{ position: "fixed", left: "-10000px", top: 0, pointerEvents: "none" }}
      >
        <div ref={printRef}>
          {printPages.map((page, i) => (
            <div key={i} className="idc-sheet" data-per={perPage}>
              {page.map((s) => (
                <IdCard key={s.id} student={s} school={school} logo={logo} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}