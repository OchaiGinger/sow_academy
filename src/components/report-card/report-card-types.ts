import type { ScoredSubject } from "./academic-record";

export type ReportSchool = {
  name: string;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  motto?: string | null;
  logoUrl?: string | null;
  stampUrl?: string | null;
  principalName?: string | null;
};

export type ReportStudent = {
  studentId: string;
  name: string;
  totalInClass: number;
  isApproved: boolean;
  isStamped: boolean;
  attendance: string;
  punctuality: string | null;
  neatness: string | null;
  conduct: string | null;
  fmRemark: string;
  subjects: ScoredSubject[];
  totalScore: number;
  average: number;
  rank: number;
  formMasterName?: string | null;
  formMasterId?: string | null;
  nextTermDate?: Date | string | null;
};

export type StampingClass = {
  id: string;
  name: string;
  approvedCount: number;
  pendingStampCount: number;
};
