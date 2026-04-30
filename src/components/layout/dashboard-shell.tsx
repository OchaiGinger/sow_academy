"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  role: string;
  isFormMaster: boolean;
  isPrincipal: boolean;
  children: React.ReactNode;
}

export function DashboardShell({
  role,
  isFormMaster,
  isPrincipal,
  children,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Sync with localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) setCollapsed(saved === "true");
    setMounted(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const newState = !c;
      localStorage.setItem("sidebar-collapsed", String(newState));
      return newState;
    });
  };

  return (
    <div className="flex min-h-screen bg-bg-base">
      {/* Sidebar Component */}
      <Sidebar
        role={role}
        isFormMaster={isFormMaster}
        isPrincipal={isPrincipal}
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
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
        <Topbar onMobileMenuOpen={() => setMobileOpen(true)} />
        
        <div className="p-4 md:p-8 flex-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}