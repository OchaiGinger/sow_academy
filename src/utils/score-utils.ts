export interface ScoreRow {
  studentId: string;
  name: string;
  admissionNo: string;
  assignment1: number;
  assignment2: number;
  test1: number;
  test2: number;
  exam: number;
  dirty: boolean;
}

export interface ScoreRowWithTotals extends ScoreRow {
  total: number;
  grade: string;
  remark: string;
}

// ─── Grading helper ───────────────────────────────────────────────────────────
// Lives here (not in score-actions) because Next.js requires all exports
// from a "use server" file to be async functions.

export function computeGrade(total: number): { grade: string; remark: string } {
  if (total >= 75) return { grade: "A1", remark: "Excellent" };
  if (total >= 70) return { grade: "B2", remark: "Very Good" };
  if (total >= 65) return { grade: "B3", remark: "Good" };
  if (total >= 60) return { grade: "C4", remark: "Credit" };
  if (total >= 55) return { grade: "C5", remark: "Credit" };
  if (total >= 50) return { grade: "C6", remark: "Credit" };
  if (total >= 45) return { grade: "D7", remark: "Pass" };
  if (total >= 40) return { grade: "E8", remark: "Pass" };
  return { grade: "F9", remark: "Fail" };
}

// ─── Select options (0.5-step increments) ────────────────────────────────────

function makeOptions(max: number, step = 0.5): string[] {
  const opts: string[] = [];
  for (let v = 0; v <= max; v += step) {
    opts.push(v % 1 === 0 ? String(v) : v.toFixed(1));
  }
  return opts;
}

export const ASSIGNMENT_OPTS = makeOptions(5, 0.5); // 0 – 5
export const TEST_OPTS = makeOptions(15, 0.5); // 0 – 15
export const EXAM_OPTS = makeOptions(60, 0.5); // 0 – 60

// ─── Derived totals ───────────────────────────────────────────────────────────

export function withTotals(rows: ScoreRow[]): ScoreRowWithTotals[] {
  return rows.map((r) => {
    const total = r.assignment1 + r.assignment2 + r.test1 + r.test2 + r.exam;
    const { grade, remark } = computeGrade(total);
    return { ...r, total, grade, remark };
  });
}

// ─── Position map (sorted by total desc) ─────────────────────────────────────

export function buildPositionMap(
  rows: ScoreRowWithTotals[],
): Map<string, number> {
  const sorted = [...rows].sort((a, b) => b.total - a.total);
  return new Map(sorted.map((r, i) => [r.studentId, i + 1]));
}

// ─── Grade badge colour ───────────────────────────────────────────────────────

export function gradeColor(grade: string): string {
  if (grade.startsWith("A"))
    return "bg-emerald-500/20 text-emerald-300 border-emerald-600/40";
  if (grade.startsWith("B"))
    return "bg-sky-500/20 text-sky-300 border-sky-600/40";
  if (grade.startsWith("C"))
    return "bg-yellow-500/20 text-yellow-300 border-yellow-600/40";
  if (grade.startsWith("D") || grade.startsWith("E"))
    return "bg-orange-500/20 text-orange-300 border-orange-600/40";
  return "bg-red-500/20 text-red-300 border-red-600/40";
}

// ─── Ordinal suffix ───────────────────────────────────────────────────────────

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
