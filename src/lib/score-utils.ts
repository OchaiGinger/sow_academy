export function calculateGrade(total: number): { grade: string; remark: string } {
  if (total >= 75) return { grade: "A1", remark: "Excellent" };
  if (total >= 70) return { grade: "B2", remark: "Very Good" };
  if (total >= 65) return { grade: "B3", remark: "Good" };
  if (total >= 60) return { grade: "C4", remark: "Credit" };
  if (total >= 55) return { grade: "C5", remark: "Credit" };
  if (total >= 50) return { grade: "C6", remark: "Credit" };
  if (total >= 45) return { grade: "D7", remark: "Pass" };
  if (total >= 40) return { grade: "E8", remark: "Poor" };
  return { grade: "F9", remark: "Fail" };
}

export function calculateTotal(scores: {
  assignment1: number;
  assignment2: number;
  test1: number;
  test2: number;
  exam: number;
}): number {
  return (
    scores.assignment1 +
    scores.assignment2 +
    scores.test1 +
    scores.test2 +
    scores.exam
  );
}

export function calculatePositions(
  scores: Array<{ studentId: string; total: number }>
): Array<{ studentId: string; position: number }> {
  const sorted = [...scores].sort((a, b) => b.total - a.total);
  let position = 1;
  return sorted.map((s, i) => {
    if (i > 0 && s.total < sorted[i - 1].total) position = i + 1;
    return { studentId: s.studentId, position };
  });
}

export function calculateOverallPosition(
  students: Array<{ studentId: string; overallTotal: number }>
): Array<{ studentId: string; overallPosition: number }> {
  const sorted = [...students].sort((a, b) => b.overallTotal - a.overallTotal);
  let pos = 1;
  return sorted.map((s, i) => {
    if (i > 0 && s.overallTotal < sorted[i - 1].overallTotal) pos = i + 1;
    return { studentId: s.studentId, overallPosition: pos };
  });
}
