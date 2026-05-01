import {
  LayoutDashboard,
  Users,
  GraduationCap,
  School,
  Book,
  Calendar,
  Clipboard,
  UserCheck,
  KeyRound,
  Settings,
  PencilRuler,
  BookCheck,
  ClipboardEdit,
  Trophy,
  User,
} from "lucide-react";
import type { NavItem } from "@/types";

export const adminNavItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/teachers", label: "Teachers", icon: GraduationCap },
  { href: "/admin/classes", label: "Classes", icon: School },
  { href: "/admin/subjects", label: "Subjects", icon: Book },
  { href: "/admin/sessions", label: "Sessions & Terms", icon: Calendar },
  {
    href: "/admin/assignments",
    label: "Class Assignments",
    icon: Clipboard,
  },
  { href: "/admin/form-masters", label: "Form Masters", icon: UserCheck },
  { href: "/admin/card-passwords", label: "Card Passwords", icon: KeyRound },
  { href: "/admin/settings", label: "School Settings", icon: Settings },
];

export const teacherNavItems: NavItem[] = [
  { href: "/teacher", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher/scores", label: "Enter Scores", icon: PencilRuler },
];

export const formMasterNavItems: NavItem[] = [
  { href: "/form-master", label: "Dashboard", icon: LayoutDashboard },
  ...teacherNavItems.filter((item) => item.href !== "/teacher"), // Inherit teacher links
  { href: "/form-master/results", label: "Class Results", icon: BookCheck },
  {
    href: "/form-master/assessments",
    label: "Student Assessments",
    icon: ClipboardEdit,
  },
];

export const studentNavItems: NavItem[] = [
  { href: "/student", label: "My Dashboard", icon: LayoutDashboard },
  { href: "/student/results", label: "My Results", icon: Trophy },
];

export const allNavItems = [
  ...adminNavItems,
  ...teacherNavItems,
  ...formMasterNavItems,
  ...studentNavItems,
];
