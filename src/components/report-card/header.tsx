// components/report-card/header.tsx
import { MapPin, Phone, Globe, Award } from "lucide-react";

export const ReportHeader = ({ school, student }: any) => {
  const average = student?.average ?? 0;
  const grade =
    average >= 75
      ? "A"
      : average >= 65
        ? "B"
        : average >= 55
          ? "C"
          : average >= 45
            ? "D"
            : "F";

  const gradeColor =
    average >= 75
      ? "text-emerald-600"
      : average >= 65
        ? "text-blue-600"
        : average >= 55
          ? "text-amber-600"
          : average >= 45
            ? "text-orange-600"
            : "text-red-600";

  return (
    <div className="shrink-0 border-b border-slate-200 bg-white print:border-slate-300">
      {/* Accent bar */}
      <div className="h-1.5 print:h-[3px] w-full bg-linear-to-r from-slate-900 via-slate-700 to-emerald-600" />

      {/* Main header row */}
      <div className="print-header-wrap px-4 md:px-10 print:px-5 py-4 md:py-5 print:py-2 flex flex-col sm:flex-row items-center gap-4 md:gap-6 print:gap-3">
        {/* Logo */}
        <div className="print-logo w-16 h-16 md:w-20 md:h-20 print:w-11 print:h-11 rounded-xl md:rounded-2xl print:rounded-lg border-2 border-slate-100 shadow-sm p-1.5 print:p-0.5 shrink-0 flex items-center justify-center bg-white">
          <img
            src={school?.logoUrl || "/logo.png"}
            className="max-h-full object-contain"
            alt="School Logo"
          />
        </div>

        {/* School Info */}
        <div className="flex-1 text-center sm:text-left space-y-1 print:space-y-0">
          <h1 className="text-lg md:text-2xl print:text-base font-black tracking-tight uppercase text-slate-900 leading-tight">
            {school?.name ?? "School Name"}
          </h1>
          {school?.motto && (
            <p className="text-emerald-600 font-medium italic text-xs print:text-[7px]">
              &ldquo;{school.motto}&rdquo;
            </p>
          )}
          <div className="flex flex-wrap justify-center sm:justify-start gap-x-3 gap-y-0.5 pt-0.5 print:pt-0">
            {school?.address && (
              <span className="flex items-center gap-1 text-[10px] print:text-[7px] text-slate-500 font-medium">
                <MapPin size={9} className="text-slate-400 shrink-0" />
                <span className="line-clamp-1">{school.address}</span>
              </span>
            )}
            {school?.phone && (
              <span className="flex items-center gap-1 text-[10px] print:text-[7px] text-slate-500 font-medium">
                <Phone size={9} className="text-slate-400 shrink-0" />
                {school.phone}
              </span>
            )}
            {school?.website && (
              <span className="flex items-center gap-1 text-[10px] print:text-[7px] text-slate-500 font-medium">
                <Globe size={9} className="text-slate-400 shrink-0" />
                {school.website}
              </span>
            )}
          </div>
        </div>

        {/* Average Badge */}
        <div className="print-badge shrink-0 flex flex-col items-center justify-center w-20 h-20 md:w-24 md:h-24 print:w-14 print:h-14 rounded-xl md:rounded-2xl print:rounded-lg border-2 border-slate-100 bg-slate-50 shadow-sm gap-0">
          <Award size={10} className="text-slate-400 mb-0.5 print:mb-0" />
          <span
            className={`text-3xl md:text-4xl print:text-2xl font-black leading-none ${gradeColor}`}
          >
            {grade}
          </span>
          <span className="text-[10px] print:text-[7px] font-bold text-slate-500">
            {average.toFixed(1)}%
          </span>
          <span className="text-[8px] print:text-[6px] text-slate-400 uppercase tracking-widest font-semibold">
            Average
          </span>
        </div>
      </div>

      {/* Name sub-bar */}
      <div className="px-4 md:px-10 print:px-5 py-1.5 print:py-1 bg-slate-900 flex items-center justify-between gap-2">
        <p className="text-[9px] print:text-[7px] font-black uppercase tracking-widest text-slate-400 shrink-0">
          Student Report Card
        </p>
        <p className="text-[10px] print:text-[8px] font-black uppercase text-white tracking-wide truncate text-right">
          {student?.name ?? ""}
        </p>
      </div>
    </div>
  );
};
