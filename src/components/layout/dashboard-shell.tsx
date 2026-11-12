"use client";

import { Toaster } from "sonner";
import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  role: string;
  isFormMaster: boolean;
  isPrincipal: boolean;
  userId: string;
  schoolName?: string;
  children: React.ReactNode;
}

export function DashboardShell({
  role,
  isFormMaster,
  isPrincipal,
  userId,
  schoolName,
  children,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const closeMobileMenu = useCallback(() => setMobileOpen(false), []);

  // Sync with localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    requestAnimationFrame(() => {
      if (saved !== null) setCollapsed(saved === "true");
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileOpen]);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const newState = !c;
      localStorage.setItem("sidebar-collapsed", String(newState));
      return newState;
    });
  };

  return (
    <div className="flex min-h-screen overflow-x-clip bg-bg-base">
      {/* Sidebar Component */}
      <Sidebar
        role={role}
        isFormMaster={isFormMaster}
        isPrincipal={isPrincipal}
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={closeMobileMenu}
        schoolName={schoolName}
      />

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/65 backdrop-blur-[2px] animate-in fade-in duration-200"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main
        className={cn(
          "flex-1 flex min-h-screen min-w-0 flex-col overflow-x-clip transition-all duration-300 ease-in-out",
          "md:ml-[var(--sidebar-width)]"
        )}
        style={
          {
            "--sidebar-width": !mounted 
              ? "220px" 
              : collapsed ? "60px" : "220px",
          } as React.CSSProperties
        }
      >
        {/* Topbar triggers the mobile side drawer */}
        <Topbar
          onMobileMenuOpen={() => setMobileOpen(true)}
          userId={userId}
          role={role}
        />
        
        <div className="p-4 md:p-8 flex-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </div>
        <Toaster position="top-right" richColors />
      </main>
    </div>
  );
}