// signature-area.tsx
import { DynamicSignature } from "./dynamic-signature";
import { ShieldCheck } from "lucide-react";

export function SignatureArea({ isApproved, isStamped, school, student }: any) {
  return (
    <div className="border-t border-slate-200 pt-4 print:pt-3 grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-6 print:gap-4">
      {/* Form Master Signature */}
      <div className="space-y-2 print:space-y-1.5">
        <p className="text-[10px] print:text-[8px] font-black uppercase tracking-widest text-slate-400">
          Form Master's Signature
        </p>
        <DynamicSignature
          teacherName={student.formMasterName ?? "Class Teacher"}
          teacherId={student.formMasterId}
          role="Form Master"
          isApproved={isApproved}
        />
        {!isApproved && (
          <p className="text-[10px] print:text-[8px] text-amber-500 italic">
            Awaiting signature…
          </p>
        )}
      </div>

      {/* Principal Stamp */}
      <div className="space-y-2 print:space-y-1.5">
        <p className="text-[10px] print:text-[8px] font-black uppercase tracking-widest text-slate-400">
          Principal's Approval
        </p>
        {isStamped ? (
          <div className="flex items-center gap-3">
            {school?.stampUrl ? (
              <img
                src={school.stampUrl}
                alt="School Seal"
                className="w-14 h-14 print:w-12 print:h-12 object-contain opacity-80"
              />
            ) : (
              <div className="w-14 h-14 print:w-12 print:h-12 rounded-full border-2 border-dashed border-slate-800 flex flex-col items-center justify-center opacity-70 shrink-0">
                <ShieldCheck size={16} className="text-slate-800" />
                <span className="text-[6px] font-black uppercase text-slate-700 mt-0.5 tracking-wider text-center leading-tight px-1">
                  {school?.name?.slice(0, 8) ?? "Official"}
                </span>
              </div>
            )}
            <div>
              <p className="text-[11px] print:text-[9px] font-black text-slate-800">
                {school?.principalName ?? "Principal"}
              </p>
              <p className="text-[10px] print:text-[8px] text-slate-400 uppercase tracking-widest">
                Principal
              </p>
              <p className="text-[9px] print:text-[8px] text-emerald-600 font-semibold mt-0.5">
                ✓ Officially Sealed
              </p>
            </div>
          </div>
        ) : (
          <p className="text-[10px] print:text-[8px] text-slate-300 italic">
            Pending principal seal…
          </p>
        )}
      </div>
    </div>
  );
}
