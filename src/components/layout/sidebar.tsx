// sidebar.tsx — remove unused Button import
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/lib/actions/auth.actions";
import {
  LayoutDashboard,
  Users,
  UserSquare2,
  GraduationCap,
  BookOpen,
  CalendarDays,
  ClipboardList,
  ShieldCheck,
  Key,
  Settings,
  LogOut,
  PencilLine,
  FileSpreadsheet,
  UserCheck,
  Stamp,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  X,
  LoaderCircle,
  CreditCard,
  School,
  type LucideIcon,
} from "lucide-react";
// ↑ removed unused Button import
import { useEffect, useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: string[];
}

interface SidebarProps {
  role: string;
  isFormMaster: boolean;
  isPrincipal: boolean;
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  schoolName?: string;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    roles: ["ADMIN"],
  },
  { label: "Students", href: "/admin/students", icon: Users, roles: ["ADMIN"] },
  {
    label: "Teachers",
    href: "/admin/teachers",
    icon: UserSquare2,
    roles: ["ADMIN"],
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    label: "Classes",
    href: "/admin/classes",
    icon: GraduationCap,
    roles: ["ADMIN"],
  },
  {
    label: "Subjects",
    href: "/admin/subjects",
    icon: BookOpen,
    roles: ["ADMIN"],
  },
  {
    label: "Academic Calendar",
    href: "/admin/sessions",
    icon: CalendarDays,
    roles: ["ADMIN"],
  },
  {
    label: "Class Assignments",
    href: "/admin/assignments",
    icon: ClipboardList,
    roles: ["ADMIN"],
  },
  {
    label: "Form Masters",
    href: "/admin/form-masters",
    icon: ShieldCheck,
    roles: ["ADMIN"],
  },
  {
    label: "Card Passwords",
    href: "/admin/card-passwords",
    icon: Key,
    roles: ["ADMIN"],
  },
  {
    label: "ID Cards",
    href: "/admin/id-cards",
    icon: CreditCard,
    roles: ["ADMIN"],
  },
  {
    label: "Teacher ID Cards",
    href: "/admin/teacher-id-cards",
    icon: CreditCard,
    roles: ["ADMIN"],
  },
  {
    label: "Validation Sheets",
    href: "/admin/validation-sheets",
    icon: FileSpreadsheet,
    roles: ["ADMIN"],
  },
  {
    label: "Schools",
    href: "/super-admin",
    icon: School,
    roles: ["SUPER_ADMIN"],
  },
  {
    label: "Results",
    href: "/admin/results",
    icon: FileSpreadsheet,
    roles: ["ADMIN"],
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
    roles: ["ADMIN"],
  },
  {
    label: "My Overview",
    href: "/teacher",
    icon: LayoutDashboard,
    roles: ["TEACHER", "PRINCIPAL", "FORM_MASTER"],
  },
  {
    label: "Enter Scores",
    href: "/teacher/scores",
    icon: PencilLine,
    roles: ["TEACHER", "PRINCIPAL", "FORM_MASTER"],
  },
  {
    label: "Form Master Desk",
    href: "/form-master",
    icon: LayoutDashboard,
    roles: ["FORM_MASTER"],
  },
  {
    label: "Class Results",
    href: "/form-master/results",
    icon: FileSpreadsheet,
    roles: ["FORM_MASTER"],
  },
  {
    label: "Assessments",
    href: "/form-master/assessments",
    icon: UserCheck,
    roles: ["FORM_MASTER"],
  },
  {
    label: "Principal Overview",
    href: "/principal",
    icon: LayoutDashboard,
    roles: ["PRINCIPAL"],
  },
  {
    label: "All Results",
    href: "/principal/results",
    icon: ScrollText,
    roles: ["PRINCIPAL"],
  },
  {
    label: "Official Sealing",
    href: "/principal/stamping",
    icon: Stamp,
    roles: ["PRINCIPAL"],
  },
  {
    label: "My Dashboard",
    href: "/student",
    icon: LayoutDashboard,
    roles: ["STUDENT"],
  },
  {
    label: "Termly Results",
    href: "/student/results",
    icon: FileSpreadsheet,
    roles: ["STUDENT"],
  },
];

export function Sidebar({
  role,
  isFormMaster,
  isPrincipal,
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
  schoolName,
}: SidebarProps) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // Close the mobile drawer and clear the navigation indicator after routing.
  useEffect(() => {
    onMobileClose();
  }, [pathname, onMobileClose]);

  const filteredItems = navItems.filter((item) => {
    if (item.roles.includes(role)) return true;
    if (isPrincipal && item.roles.includes("PRINCIPAL")) return true;
    if (isFormMaster && item.roles.includes("FORM_MASTER")) return true;
    return false;
  });

  return (
    <>
      {/* SIDEBAR (Drawer on mobile, Fixed on desktop) */}
      <aside
          className={cn(
            "fixed inset-0 z-50 box-border flex h-dvh max-h-dvh w-[min(18rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] flex-col overflow-x-hidden overflow-y-hidden bg-bg-surface border-r border-border-subtle shadow-2xl transition-transform duration-300 ease-in-out md:inset-y-0 md:right-auto md:w-auto md:max-w-none md:shadow-none",
            // Keep the mobile drawer within the viewport; desktop remains a fixed rail.
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          // Desktop collapse state
          collapsed ? "md:w-[60px]" : "md:w-[220px]",
        )}
          aria-label="Main navigation"
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center h-14 border-b border-border-subtle px-4",
            collapsed ? "md:justify-center" : "justify-between",
          )}
        >
          {(!collapsed || mobileOpen) && (
            <span className="text-primary font-black tracking-tighter text-lg uppercase italic">
              {schoolName ?? "Academia"}
            </span>
          )}

          {/* Desktop Toggle Button */}
          <button
            onClick={onToggle}
            className="hidden md:flex p-1.5 hover:bg-bg-elevated rounded-md text-text-tertiary"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onMobileClose}
            className="md:hidden p-1.5 hover:bg-bg-elevated rounded-md"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 space-y-1">
          {filteredItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const isPending = pendingHref === item.href && !isActive;
            const isExpanded = !collapsed || mobileOpen;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                aria-busy={isPending}
                onClick={() => {
                  if (isActive) return;
                  setPendingHref(item.href);
                }}
                className={cn(
                  "flex min-h-11 items-center rounded-md border-l-4 text-sm transition-all group relative",
                  isExpanded ? "gap-3 px-3 py-2.5" : "justify-center p-2.5",
                  isActive
                    ? "border-primary bg-accent-muted text-primary font-bold shadow-sm"
                    : isPending
                      ? "border-primary/60 bg-bg-elevated text-primary font-bold"
                      : "border-transparent text-text-secondary hover:border-border-strong hover:bg-bg-elevated hover:text-text-primary",
                )}
              >
                {isPending ? (
                  <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-primary" aria-hidden="true" />
                ) : (
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-primary" : "text-text-tertiary",
                    )}
                  />
                )}
                {isExpanded && <span className="truncate">{item.label}</span>}
                {isExpanded && isPending && <span className="sr-only">Loading</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="shrink-0 p-3 border-t border-border-subtle">
          <button
            onClick={() => signOutAction()}
            className={cn(
              "w-full flex items-center p-2 text-sm text-text-secondary hover:text-danger rounded-sm",
              !collapsed || mobileOpen ? "gap-2" : "justify-center",
            )}
          >
            <LogOut size={16} />
            {(!collapsed || mobileOpen) && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
