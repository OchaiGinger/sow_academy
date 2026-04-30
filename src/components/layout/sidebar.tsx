// sidebar.tsx — remove unused Button import
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
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
  Menu,
  X,
} from "lucide-react";
// ↑ removed unused Button import
import { useState, useEffect } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: any;
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
}: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  // Auto-close on mobile when route changes
  useEffect(() => {
    onMobileClose();
  }, [pathname]);

  const filteredItems = navItems.filter((item) => {
    if (item.roles.includes(role)) return true;
    if (isFormMaster && item.roles.includes("FORM_MASTER")) return true;
    return false;
  });

  const initials =
    session?.user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <>
      {/* SIDEBAR (Drawer on mobile, Fixed on desktop) */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen z-50 flex flex-col bg-bg-surface border-r border-border-subtle transition-all duration-300 ease-in-out",
          // Mobile state
          "w-[280px] md:w-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          // Desktop collapse state
          collapsed ? "md:w-[60px]" : "md:w-[220px]",
        )}
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
              Academia
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
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const isExpanded = !collapsed || mobileOpen;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-sm text-sm transition-all group relative",
                  isExpanded ? "gap-3 px-3 py-2.5" : "justify-center p-2.5",
                  isActive
                    ? "bg-accent-muted text-primary font-bold"
                    : "text-text-secondary hover:bg-bg-elevated",
                )}
              >
                <item.icon
                  className={cn(
                    "w-4 h-4",
                    isActive ? "text-primary" : "text-text-tertiary",
                  )}
                />
                {isExpanded && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-border-subtle">
          <button
            onClick={() =>
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    window.location.href = "/student";
                  },
                },
              })
            }
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
