"use client";

import { useReactToPrint } from "react-to-print";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, Search, X, Users, GraduationCap } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type SchoolBranding = {
  name: string;
  email: string;
  logoUrl: string | null;
  address: string;
  phone: string;
};

type StudentForSheet = {
  id: string;
  admissionNo: string;
  user: { name: string; email: string; phone: string | null };
  class: { name: string; level: string; arm: string } | null;
  dateOfBirth: Date | null;
  gender: "MALE" | "FEMALE" | null;
  guardianName: string | null;
  guardianPhone: string | null;
};

type TeacherForSheet = {
  id: string;
  staffId: string | null;
  user: { name: string; email: string; phone: string | null };
  classSubjects: { class: { name: string }; subject: { name: string } }[];
  formMasters: { class: { name: string } }[];
};

type ClassWithStudents = {
  id: string;
  name: string;
  level: string;
  arm: string;
  students: StudentForSheet[];
};

type SheetType = "students" | "teachers";

/* -------------------------------------------------------------------------- */
/*  Print Styles (only applied during printing via @media print)              */
/* -------------------------------------------------------------------------- */

const PRINT_STYLES: string = `
@media print {
  @page{size:A4 portrait;margin:0}
  html,body{margin:0;padding:0;background:#fff}
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box}
  
  .vs-sheet{width:210mm;min-height:297mm;box-sizing:border-box;padding:10mm 8mm 12mm;background:#fff;font-family:"Inter",system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#111;break-inside:avoid;page-break-inside:avoid}
  .vs-sheet:not(:last-child){break-after:page;page-break-after:always}
  .vs-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:4mm;border-bottom:2px solid #0f3d3e;padding-bottom:3mm}
  .vs-school{flex:1}
  .vs-school-name{font-weight:800;font-size:12pt;color:#0f3d3e;line-height:1.1}
  .vs-school-meta{font-size:6.5pt;color:#555;margin-top:0.5mm;line-height:1.4}
  .vs-title{text-align:right}
  .vs-title-main{font-weight:800;font-size:11pt;color:#0f3d3e;text-transform:uppercase;letter-spacing:.04em}
  .vs-title-sub{font-size:7pt;color:#666;margin-top:0.5mm}
  .vs-class-info{margin-top:3mm;padding:1.5mm 2.5mm;background:#f5faf9;border:1px solid #d1e7e3;border-radius:3px}
  .vs-class-info-row{display:flex;gap:4mm;font-size:7.5pt}
  .vs-class-info-label{font-weight:700;color:#0f3d3e;min-width:40mm}
  .vs-class-info-value{color:#333}
  .vs-table{width:100%;border-collapse:collapse;margin-top:3mm;font-size:6.5pt}
  .vs-table th,.vs-table td{border:1px solid #d1e7e3;padding:1.8mm 1.5mm;vertical-align:top;text-align:left}
  .vs-table th{background:#0f3d3e;color:#fff;font-weight:700;text-transform:uppercase;letter-spacing:.02em}
  .vs-table tr:nth-child(even) td{background:#fafdfc}
  .vs-table .vs-col-num{width:8mm;text-align:center}
  .vs-table .vs-col-name{width:42mm}
  .vs-table .vs-col-gender{width:12mm;text-align:center}
  .vs-table .vs-col-class{width:22mm;text-align:center}
  .vs-table .vs-col-dob{width:35mm;text-align:center}
  .vs-table .vs-col-email{width:35mm}
  .vs-table .vs-col-guardian{width:32mm}
  .vs-table .vs-col-phone{width:25mm;text-align:center}
  .vs-table .vs-col-subjects{width:60mm}
  .vs-table .vs-col-formmaster{width:30mm;text-align:center}
/* Student/Teacher row pairs as visual "boxes" */
.vs-student-data-row td,
.vs-teacher-data-row td{border-bottom:1px solid #d1e7e3}
.vs-student-correction-row td,
.vs-teacher-correction-row td{border-top:none;border-bottom:1px solid #d1e7e3;padding:2mm 1.5mm}
.vs-correction-cell{height:6mm;background:#fafafa;border:1px solid #e0e0e0;border-top:none}

/* 2px gap between student/teacher boxes */
.vs-student-correction-row + .vs-student-data-row td,
.vs-teacher-correction-row + .vs-teacher-data-row td{border-top:2px solid #fff}
.vs-student-correction-row + .vs-student-data-row,
.vs-teacher-correction-row + .vs-teacher-data-row{border-spacing:0;border-collapse:separate}

  .vs-footer{margin-top:4mm;padding-top:2mm;border-top:1px solid #e0e0e0;display:flex;justify-content:space-between;font-size:6pt;color:#888}
  .vs-footer-left{display:flex;align-items:center;gap:1.5mm}
  .vs-footer-right{text-align:right}
  .vs-signature{margin-top:6mm;display:flex;gap:25mm}
  .vs-signature-block{text-align:center;min-width:45mm}
  .vs-signature-line{border-top:1px solid #333;height:8mm;margin-bottom:1.5mm}
  .vs-signature-label{font-size:6pt;color:#666;text-transform:uppercase;letter-spacing:.03em}
  .vs-teacher-table th,.vs-teacher-table td{border:1px solid #d1e7e3;padding:1.8mm 1.5mm;vertical-align:top;text-align:left}
  .vs-teacher-table th{background:#0f3d3e;color:#fff;font-weight:700;text-transform:uppercase;letter-spacing:.02em}
  .vs-teacher-table tr:nth-child(even) td{background:#fafdfc}
  .vs-teacher-table .vs-col-tnum{width:8mm;text-align:center}
  .vs-teacher-table .vs-col-tname{width:42mm}
  .vs-teacher-table .vs-col-tstaff{width:20mm;text-align:center}
  .vs-teacher-table .vs-col-temail{width:35mm}
  .vs-teacher-table .vs-col-tphone{width:22mm;text-align:center}
  .vs-teacher-table .vs-col-tsubjects{width:60mm}
  .vs-teacher-table .vs-col-tformmaster{width:28mm;text-align:center}
}
`;

/* Screen-only styles for preview */
const SCREEN_STYLES: string = `
.vs-sheet-screen{width:100%;min-height:auto;box-sizing:border-box;padding:16px;background:#fff;font-family:"Inter",system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#111}
.vs-header-screen{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;border-bottom:2px solid #0f3d3e;padding-bottom:8px}
.vs-school-name-screen{font-weight:800;font-size:1.125rem;color:#0f3d3e;line-height:1.2}
.vs-school-meta-screen{font-size:0.7rem;color:#6b7280;margin-top:2px;line-height:1.4}
.vs-title-screen{text-align:right}
.vs-title-main-screen{font-weight:800;font-size:1rem;color:#0f3d3e;text-transform:uppercase;letter-spacing:.04em}
.vs-title-sub-screen{font-size:0.7rem;color:#6b7280;margin-top:2px}
.vs-class-info-screen{margin-top:8px;padding:8px 12px;background:#f5faf9;border:1px solid #d1e7e3;border-radius:6px}
.vs-class-info-row-screen{display:flex;gap:12px;font-size:0.75rem}
.vs-class-info-label-screen{font-weight:700;color:#0f3d3e;min-width:120px}
.vs-class-info-value-screen{color:#374151}
.vs-table-screen{width:100%;border-collapse:collapse;margin-top:8px;font-size:0.7rem}
.vs-table-screen th,.vs-table-screen td{border:1px solid #d1e7e3;padding:6px 8px;vertical-align:top;text-align:left}
.vs-table-screen th{background:#0f3d3e;color:#fff;font-weight:700;text-transform:uppercase;letter-spacing:.02em}
.vs-table-screen tr:nth-child(even) td{background:#fafdfc}
.vs-table-screen .vs-col-num-screen{width:30px;text-align:center}
.vs-table-screen .vs-col-name-screen{width:160px}
.vs-table-screen .vs-col-gender-screen{width:45px;text-align:center}
.vs-table-screen .vs-col-class-screen{width:80px;text-align:center}
.vs-table-screen .vs-col-dob-screen{width:120px;text-align:center}
.vs-table-screen .vs-col-email-screen{width:140px}
.vs-table-screen .vs-col-guardian-screen{width:120px}
.vs-table-screen .vs-col-phone-screen{width:90px;text-align:center}
.vs-table-screen .vs-col-subjects-screen{width:220px}
.vs-table-screen .vs-col-formmaster-screen{width:100px;text-align:center}
/* Student/Teacher row pairs as visual "boxes" (screen) */
.vs-student-data-row-screen td,
.vs-teacher-data-row-screen td{border-bottom:1px solid #d1e7e3}
.vs-student-correction-row-screen td,
.vs-teacher-correction-row-screen td{border-top:none;border-bottom:1px solid #d1e7e3;padding:6px 8px}
.vs-correction-cell-screen{height:20px;background:#fafafa;border:1px solid #e5e7eb;border-top:none}

/* 2px gap between student/teacher boxes (screen) */
.vs-student-correction-row-screen + .vs-student-data-row-screen td,
.vs-teacher-correction-row-screen + .vs-teacher-data-row-screen td{border-top:2px solid #fff}
.vs-student-correction-row-screen + .vs-student-data-row-screen,
.vs-teacher-correction-row-screen + .vs-teacher-data-row-screen{border-spacing:0;border-collapse:separate}

.vs-footer-screen{margin-top:12px;padding-top:8px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:0.65rem;color:#9ca3af}
.vs-footer-left-screen{display:flex;align-items:center;gap:6px}
.vs-footer-right-screen{text-align:right}
.vs-signature-screen{margin-top:16px;display:flex;gap:40px}
.vs-signature-block-screen{text-align:center;min-width:140px}
.vs-signature-line-screen{border-top:1px solid #374151;height:24px;margin-bottom:4px}
.vs-signature-label-screen{font-size:0.6rem;color:#6b7280;text-transform:uppercase;letter-spacing:.03em}
.vs-teacher-table-screen th,.vs-teacher-table-screen td{border:1px solid #d1e7e3;padding:6px 8px;vertical-align:top;text-align:left}
.vs-teacher-table-screen th{background:#0f3d3e;color:#fff;font-weight:700;text-transform:uppercase;letter-spacing:.02em}
.vs-teacher-table-screen tr:nth-child(even) td{background:#fafdfc}
.vs-teacher-table-screen .vs-col-tnum-screen{width:30px;text-align:center}
.vs-teacher-table-screen .vs-col-tname-screen{width:160px}
.vs-teacher-table-screen .vs-col-tstaff-screen{width:70px;text-align:center}
.vs-teacher-table-screen .vs-col-temail-screen{width:140px}
.vs-teacher-table-screen .vs-col-tphone-screen{width:80px;text-align:center}
.vs-teacher-table-screen .vs-col-tsubjects-screen{width:220px}
.vs-teacher-table-screen .vs-col-tformmaster-screen{width:100px;text-align:center}
`;

/* -------------------------------------------------------------------------- */
/*  Helper Functions                                                          */
/* -------------------------------------------------------------------------- */

function formatDate(date: Date | null): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, " | ");
}

function formatGender(gender: "MALE" | "FEMALE" | null): string {
  if (!gender) return "—";
  return gender === "MALE" ? "M" : "F";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/* -------------------------------------------------------------------------- */
/*  Student Sheet Row (Print)                                                 */
/* -------------------------------------------------------------------------- */

function StudentRow({
  index,
  student,
}: {
  index: number;
  student: StudentForSheet;
}) {
  return (
    <>
      <tr className="vs-student-data-row">
        <td className="vs-col-num">{index}</td>
        <td className="vs-col-name">{student.user.name}</td>
        <td className="vs-col-gender">{formatGender(student.gender)}</td>
        <td className="vs-col-class">{student.class?.name ?? "—"}</td>
        <td className="vs-col-dob">{formatDate(student.dateOfBirth)}</td>
        <td className="vs-col-email">{student.user.email}</td>
        <td className="vs-col-guardian">{student.guardianName ?? "—"}</td>
        <td className="vs-col-phone">{student.guardianPhone ?? student.user.phone ?? "—"}</td>
      </tr>
      <tr className="vs-student-correction-row">
        <td colSpan={8} className="vs-correction-cell"></td>
      </tr>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Teacher Sheet Row (Print)                                                 */
/* -------------------------------------------------------------------------- */

function TeacherRow({
  index,
  teacher,
}: {
  index: number;
  teacher: TeacherForSheet;
}) {
  const subjects = teacher.classSubjects.map(cs => `${cs.class.name}: ${cs.subject.name}`).join("; ");
  const formMasterClasses = teacher.formMasters.map(fm => fm.class.name).join(", ");

  return (
    <>
      <tr className="vs-teacher-data-row">
        <td className="vs-col-tnum">{index}</td>
        <td className="vs-col-tname">{teacher.user.name}</td>
        <td className="vs-col-tstaff">{teacher.staffId ?? "—"}</td>
        <td className="vs-col-temail">{teacher.user.email}</td>
        <td className="vs-col-tphone">{teacher.user.phone ?? "—"}</td>
        <td className="vs-col-tsubjects">{subjects || "—"}</td>
        <td className="vs-col-tformmaster">{formMasterClasses || "—"}</td>
      </tr>
      <tr className="vs-teacher-correction-row">
        <td colSpan={7} className="vs-correction-cell"></td>
      </tr>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Student Sheet Component (Screen Preview)                                  */
/* -------------------------------------------------------------------------- */

function StudentSheet({
  classData,
  school,
}: {
  classData: ClassWithStudents;
  school: SchoolBranding;
}) {
  return (
    <div className="vs-sheet-screen">
      <div className="vs-header-screen">
        <div className="vs-school">
          <div className="vs-school-name-screen">{school.name}</div>
          <div className="vs-school-meta-screen">
            {school.address && <div>{school.address}</div>}
            {school.phone && <div>Tel: {school.phone}</div>}
            {school.email && <div>Email: {school.email}</div>}
          </div>
        </div>
        <div className="vs-title-screen">
          <div className="vs-title-main-screen">Student Validation Sheet</div>
          <div className="vs-title-sub-screen">Class: {classData.name} &nbsp;|&nbsp; Academic Session: 2025/2026</div>
        </div>
      </div>

      <div className="vs-class-info-screen">
        <div className="vs-class-info-row-screen">
          <span className="vs-class-info-label-screen">Class:</span>
          <span className="vs-class-info-value-screen">{classData.name} (Level: {classData.level}, Arm: {classData.arm})</span>
        </div>
        <div className="vs-class-info-row-screen">
          <span className="vs-class-info-label-screen">Total Students:</span>
          <span className="vs-class-info-value-screen">{classData.students.length}</span>
        </div>
        <div className="vs-class-info-row-screen">
          <span className="vs-class-info-label-screen">Date Generated:</span>
          <span className="vs-class-info-value-screen">{new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</span>
        </div>
      </div>

      <table className="vs-table-screen">
        <thead>
          <tr>
            <th className="vs-col-num-screen">#</th>
            <th className="vs-col-name-screen">Student Name</th>
            <th className="vs-col-gender-screen">Gender</th>
            <th className="vs-col-class-screen">Class</th>
            <th className="vs-col-dob-screen">D.O.B (DD | MM | YYYY)</th>
            <th className="vs-col-email-screen">Email</th>
            <th className="vs-col-guardian-screen">Guardian Name</th>
            <th className="vs-col-phone-screen">Guardian Phone</th>
          </tr>
        </thead>
        <tbody>
          {classData.students.map((student, i) => (
            <StudentRowScreen key={student.id} index={i + 1} student={student} />
          ))}
          {classData.students.length === 0 && (
            <tr>
              <td colSpan={8} style={{ textAlign: "center", padding: "24px", color: "#9ca3af" }}>
                No students in this class
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="vs-footer-screen">
        <div className="vs-footer-left-screen">
          <span>Generated by {school.name} Management System</span>
        </div>
        <div className="vs-footer-right-screen">
          Page 1 of 1
        </div>
      </div>

      <div className="vs-signature-screen">
        <div className="vs-signature-block-screen">
          <div className="vs-signature-line-screen"></div>
          <div className="vs-signature-label-screen">Form Master Signature & Date</div>
        </div>
        <div className="vs-signature-block-screen">
          <div className="vs-signature-line-screen"></div>
          <div className="vs-signature-label-screen">Principal Signature & Date</div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Student Sheet Row (Screen Preview)                                        */
/* -------------------------------------------------------------------------- */

function StudentRowScreen({
  index,
  student,
}: {
  index: number;
  student: StudentForSheet;
}) {
  return (
    <>
      <tr className="vs-student-data-row-screen">
        <td className="vs-col-num-screen">{index}</td>
        <td className="vs-col-name-screen">{student.user.name}</td>
        <td className="vs-col-gender-screen">{formatGender(student.gender)}</td>
        <td className="vs-col-class-screen">{student.class?.name ?? "—"}</td>
        <td className="vs-col-dob-screen">{formatDate(student.dateOfBirth)}</td>
        <td className="vs-col-email-screen">{student.user.email}</td>
        <td className="vs-col-guardian-screen">{student.guardianName ?? "—"}</td>
        <td className="vs-col-phone-screen">{student.guardianPhone ?? student.user.phone ?? "—"}</td>
      </tr>
      <tr className="vs-student-correction-row-screen">
        <td colSpan={8} className="vs-correction-cell-screen"></td>
      </tr>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Teacher Sheet Component (Screen Preview)                                  */
/* -------------------------------------------------------------------------- */

function TeacherSheet({
  teachers,
  school,
}: {
  teachers: TeacherForSheet[];
  school: SchoolBranding;
}) {
  return (
    <div className="vs-sheet-screen">
      <div className="vs-header-screen">
        <div className="vs-school">
          <div className="vs-school-name-screen">{school.name}</div>
          <div className="vs-school-meta-screen">
            {school.address && <div>{school.address}</div>}
            {school.phone && <div>Tel: {school.phone}</div>}
            {school.email && <div>Email: {school.email}</div>}
          </div>
        </div>
        <div className="vs-title-screen">
          <div className="vs-title-main-screen">Teacher Validation Sheet</div>
          <div className="vs-title-sub-screen">All Teachers &nbsp;|&nbsp; Academic Session: 2025/2026</div>
        </div>
      </div>

      <div className="vs-class-info-screen">
        <div className="vs-class-info-row-screen">
          <span className="vs-class-info-label-screen">Total Teachers:</span>
          <span className="vs-class-info-value-screen">{teachers.length}</span>
        </div>
        <div className="vs-class-info-row-screen">
          <span className="vs-class-info-label-screen">Date Generated:</span>
          <span className="vs-class-info-value-screen">{new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</span>
        </div>
      </div>

      <table className="vs-table-screen vs-teacher-table-screen">
        <thead>
          <tr>
            <th className="vs-col-tnum-screen">#</th>
            <th className="vs-col-tname-screen">Teacher Name</th>
            <th className="vs-col-tstaff-screen">Staff ID</th>
            <th className="vs-col-temail-screen">Email</th>
            <th className="vs-col-tphone-screen">Phone</th>
            <th className="vs-col-tsubjects-screen">Subjects (Class: Subject)</th>
            <th className="vs-col-tformmaster-screen">Form Master Of</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((teacher, i) => (
            <TeacherRowScreen key={teacher.id} index={i + 1} teacher={teacher} />
          ))}
          {teachers.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "#9ca3af" }}>
                No teachers found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="vs-footer-screen">
        <div className="vs-footer-left-screen">
          <span>Generated by {school.name} Management System</span>
        </div>
        <div className="vs-footer-right-screen">
          Page 1 of 1
        </div>
      </div>

      <div className="vs-signature-screen">
        <div className="vs-signature-block-screen">
          <div className="vs-signature-line-screen"></div>
          <div className="vs-signature-label-screen">Principal Signature & Date</div>
        </div>
        <div className="vs-signature-block-screen">
          <div className="vs-signature-line-screen"></div>
          <div className="vs-signature-label-screen">Admin Signature & Date</div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Teacher Sheet Row (Screen Preview)                                        */
/* -------------------------------------------------------------------------- */

function TeacherRowScreen({
  index,
  teacher,
}: {
  index: number;
  teacher: TeacherForSheet;
}) {
  const subjects = teacher.classSubjects.map(cs => `${cs.class.name}: ${cs.subject.name}`).join("; ");
  const formMasterClasses = teacher.formMasters.map(fm => fm.class.name).join(", ");

  return (
    <>
      <tr className="vs-teacher-data-row-screen">
        <td className="vs-col-tnum-screen">{index}</td>
        <td className="vs-col-tname-screen">{teacher.user.name}</td>
        <td className="vs-col-tstaff-screen">{teacher.staffId ?? "—"}</td>
        <td className="vs-col-temail-screen">{teacher.user.email}</td>
        <td className="vs-col-tphone-screen">{teacher.user.phone ?? "—"}</td>
        <td className="vs-col-tsubjects-screen">{subjects || "—"}</td>
        <td className="vs-col-tformmaster-screen">{formMasterClasses || "—"}</td>
      </tr>
      <tr className="vs-teacher-correction-row-screen">
        <td colSpan={7} className="vs-correction-cell-screen"></td>
      </tr>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Print-only Sheet Components (used only during printing)                   */
/* -------------------------------------------------------------------------- */

function StudentSheetPrint({
  classData,
  school,
}: {
  classData: ClassWithStudents;
  school: SchoolBranding;
}) {
  return (
    <div className="vs-sheet">
      <div className="vs-header">
        <div className="vs-school">
          <div className="vs-school-name">{school.name}</div>
          <div className="vs-school-meta">
            {school.address && <div>{school.address}</div>}
            {school.phone && <div>Tel: {school.phone}</div>}
            {school.email && <div>Email: {school.email}</div>}
          </div>
        </div>
        <div className="vs-title">
          <div className="vs-title-main">Student Validation Sheet</div>
          <div className="vs-title-sub">Class: {classData.name} &nbsp;|&nbsp; Academic Session: 2025/2026</div>
        </div>
      </div>

      <div className="vs-class-info">
        <div className="vs-class-info-row">
          <span className="vs-class-info-label">Class:</span>
          <span className="vs-class-info-value">{classData.name} (Level: {classData.level}, Arm: {classData.arm})</span>
        </div>
        <div className="vs-class-info-row">
          <span className="vs-class-info-label">Total Students:</span>
          <span className="vs-class-info-value">{classData.students.length}</span>
        </div>
        <div className="vs-class-info-row">
          <span className="vs-class-info-label">Date Generated:</span>
          <span className="vs-class-info-value">{new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</span>
        </div>
      </div>

      <table className="vs-table">
        <thead>
          <tr>
            <th className="vs-col-num">#</th>
            <th className="vs-col-name">Student Name</th>
            <th className="vs-col-gender">Gender</th>
            <th className="vs-col-class">Class</th>
            <th className="vs-col-dob">D.O.B (DD | MM | YYYY)</th>
            <th className="vs-col-email">Email</th>
            <th className="vs-col-guardian">Guardian Name</th>
            <th className="vs-col-phone">Guardian Phone</th>
          </tr>
        </thead>
        <tbody>
          {classData.students.map((student, i) => (
            <StudentRow key={student.id} index={i + 1} student={student} />
          ))}
          {classData.students.length === 0 && (
            <tr>
              <td colSpan={8} style={{ textAlign: "center", padding: "10mm", color: "#999" }}>
                No students in this class
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="vs-footer">
        <div className="vs-footer-left">
          <span>Generated by {school.name} Management System</span>
        </div>
        <div className="vs-footer-right">
          Page 1 of 1
        </div>
      </div>

      <div className="vs-signature">
        <div className="vs-signature-block">
          <div className="vs-signature-line"></div>
          <div className="vs-signature-label">Form Master Signature & Date</div>
        </div>
        <div className="vs-signature-block">
          <div className="vs-signature-line"></div>
          <div className="vs-signature-label">Principal Signature & Date</div>
        </div>
      </div>
    </div>
  );
}

function TeacherSheetPrint({
  teachers,
  school,
}: {
  teachers: TeacherForSheet[];
  school: SchoolBranding;
}) {
  return (
    <div className="vs-sheet">
      <div className="vs-header">
        <div className="vs-school">
          <div className="vs-school-name">{school.name}</div>
          <div className="vs-school-meta">
            {school.address && <div>{school.address}</div>}
            {school.phone && <div>Tel: {school.phone}</div>}
            {school.email && <div>Email: {school.email}</div>}
          </div>
        </div>
        <div className="vs-title">
          <div className="vs-title-main">Teacher Validation Sheet</div>
          <div className="vs-title-sub">All Teachers &nbsp;|&nbsp; Academic Session: 2025/2026</div>
        </div>
      </div>

      <div className="vs-class-info">
        <div className="vs-class-info-row">
          <span className="vs-class-info-label">Total Teachers:</span>
          <span className="vs-class-info-value">{teachers.length}</span>
        </div>
        <div className="vs-class-info-row">
          <span className="vs-class-info-label">Date Generated:</span>
          <span className="vs-class-info-value">{new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</span>
        </div>
      </div>

      <table className="vs-table vs-teacher-table">
        <thead>
          <tr>
            <th className="vs-col-tnum">#</th>
            <th className="vs-col-tname">Teacher Name</th>
            <th className="vs-col-tstaff">Staff ID</th>
            <th className="vs-col-temail">Email</th>
            <th className="vs-col-tphone">Phone</th>
            <th className="vs-col-tsubjects">Subjects (Class: Subject)</th>
            <th className="vs-col-tformmaster">Form Master Of</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((teacher, i) => (
            <TeacherRow key={teacher.id} index={i + 1} teacher={teacher} />
          ))}
          {teachers.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: "center", padding: "10mm", color: "#999" }}>
                No teachers found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="vs-footer">
        <div className="vs-footer-left">
          <span>Generated by {school.name} Management System</span>
        </div>
        <div className="vs-footer-right">
          Page 1 of 1
        </div>
      </div>

      <div className="vs-signature">
        <div className="vs-signature-block">
          <div className="vs-signature-line"></div>
          <div className="vs-signature-label">Principal Signature & Date</div>
        </div>
        <div className="vs-signature-block">
          <div className="vs-signature-line"></div>
          <div className="vs-signature-label">Admin Signature & Date</div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Client Component                                                     */
/* -------------------------------------------------------------------------- */

export function ValidationSheetsClient({
  classes,
  school,
}: {
  classes: ClassWithStudents[];
  school: SchoolBranding;
}) {
  const [sheetType, setSheetType] = useState<SheetType>("students");
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [printIds, setPrintIds] = useState<string[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch teachers for teacher sheet
  const [teachers, setTeachers] = useState<TeacherForSheet[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(true);

  // Fetch teachers on mount
  useMemo(() => {
    const fetchTeachers = async () => {
      try {
        const data = await fetch("/api/admin/teachers/validation-data").then(r => r.json());
        setTeachers(data);
      } catch (e) {
        console.error("Failed to fetch teachers:", e);
      } finally {
        setTeachersLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  // Filter classes based on search
  const filteredClasses = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.level.toLowerCase().includes(q) ||
      c.arm.toLowerCase().includes(q)
    );
  }, [classes, query]);

  // Get selected class data
  const selectedClass = useMemo(() => {
    if (selectedClassId === "all") return null;
    return classes.find(c => c.id === selectedClassId) || null;
  }, [classes, selectedClassId]);

  // Print handlers
  const reactToPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Validation_Sheet_${sheetType}_${selectedClassId === "all" ? "all" : selectedClass?.name}`,
    pageStyle: PRINT_STYLES,
    onAfterPrint: () => setPrintIds([]),
  });

  const printStudentSheets = (classIds: string[]) => {
    if (classIds.length === 0) {
      toast.error("Select at least one class to print.");
      return;
    }
    flushSync(() => setPrintIds(classIds));
    reactToPrint();
  };

  const printTeacherSheet = () => {
    if (teachers.length === 0) {
      toast.error("No teachers to print.");
      return;
    }
    flushSync(() => setPrintIds(["teachers"]));
    reactToPrint();
  };

  const printPages = useMemo(() => {
    if (sheetType === "students") {
      const ids = new Set(printIds);
      return classes.filter(c => ids.has(c.id)).map(c => ({ type: "student" as const, classData: c }));
    } else {
      return [{ type: "teacher" as const, teachers }];
    }
  }, [printIds, classes, sheetType, teachers]);

  return (
    <div className="space-y-4 pb-24">
      <style>{SCREEN_STYLES}</style>
      <style>{PRINT_STYLES}</style>

      {/* Toolbar */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        {/* Sheet Type Tabs */}
        <Tabs value={sheetType} onValueChange={(value: string) => setSheetType(value as SheetType)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="students">
              <Users className="h-4 w-4 mr-2" />
              Student Sheets
            </TabsTrigger>
            <TabsTrigger value="teachers">
              <GraduationCap className="h-4 w-4 mr-2" />
              Teacher Sheet
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {sheetType === "students" && (
          <>
            {/* Class Selector & Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex flex-1 flex-col sm:flex-row gap-3">
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger className="w-full sm:max-w-xs">
                    <SelectValue placeholder="Select a class or All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.level} {c.arm})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative w-full sm:max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search class name, level, arm..."
                    className="h-9 pl-8 text-sm"
                    aria-label="Search classes"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => printStudentSheets(selectedClassId === "all" ? classes.map(c => c.id) : [selectedClassId])}
                  disabled={selectedClassId === "all" ? classes.length === 0 : !selectedClass}
                  className="gap-2"
                >
                  <Printer className="h-4 w-4" />
                  {selectedClassId === "all" ? `Print All (${classes.length})` : `Print ${selectedClass?.name}`}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setQuery(""); setSelectedClassId("all"); }}
                  className="gap-2"
                >
                  <X className="h-3.5 w-3.5" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Preview Area */}
            <div className="border rounded-lg overflow-hidden bg-card">
              {selectedClassId === "all" ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Select a class to preview the validation sheet</p>
                  <p className="text-sm mt-1">Or click "Print All" to generate sheets for all classes</p>
                </div>
              ) : selectedClass ? (
                <div className="p-4 max-h-[600px] overflow-auto">
                  <StudentSheet classData={selectedClass} school={school} />
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  <p>Class not found</p>
                </div>
              )}
            </div>
          </>
        )}

        {sheetType === "teachers" && (
          <>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex flex-1 flex-col sm:flex-row gap-3">
                <div className="relative w-full sm:max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search teacher name, email..."
                    className="h-9 pl-8 text-sm"
                    aria-label="Search teachers"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={printTeacherSheet}
                  disabled={teachersLoading || teachers.length === 0}
                  className="gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print Teacher Sheet ({teachers.length})
                </Button>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden bg-card">
              {teachersLoading ? (
                <div className="p-6 text-center text-muted-foreground">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                  <p>Loading teachers...</p>
                </div>
              ) : (
                <div className="p-4 max-h-[600px] overflow-auto">
                  <TeacherSheet teachers={teachers} school={school} />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Off-screen print target */}
      <div
        aria-hidden
        style={{ position: "fixed", left: "-10000px", top: 0, pointerEvents: "none" }}
      >
        <div ref={printRef}>
          {printPages.map((page, i) => (
            <div key={i}>
              {page.type === "student" && (
                <StudentSheetPrint classData={page.classData} school={school} />
              )}
              {page.type === "teacher" && (
                <TeacherSheetPrint teachers={page.teachers} school={school} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}