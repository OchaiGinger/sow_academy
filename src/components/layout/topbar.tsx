"use client";

import { usePathname, useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { getCurrentTermInfo } from "@/app/actions/term-action";
import { LogOut, Menu } from "lucide-react";
import NotificationInbox from "./notification-inbox";
import { AnnouncementButton } from "./announcement-button";
import { signOutAction } from "@/lib/actions/auth.actions";

interface TopbarProps {
  onMobileMenuOpen: () => void;
  userId: string;
  role: string;
}

export function Topbar({ onMobileMenuOpen, userId, role }: TopbarProps) {
  const pathname = usePathname();
  const params = useParams();
  const [termDisplay, setTermDisplay] = useState<string | null>(null);

  useEffect(() => {
    getCurrentTermInfo()
      .then((val) => setTermDisplay(val ?? "No Active Term")) // ← null guard
      .catch(() => setTermDisplay("No Active Term")); // ← catch errors
  }, []);

  const getPageTitle = () => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) return "Dashboard";

    if (pathname.includes("/scores/") && params.classSubjectId) {
      return "Score Entry";
    }

    const lastPart = parts[parts.length - 1];
    const isId = lastPart.length > 20 || /\d/.test(lastPart);

    if (isId) {
      const parent = parts[parts.length - 2];
      return parent
        ? parent.charAt(0).toUpperCase() + parent.slice(1)
        : "Details";
    }

    return (
      lastPart.charAt(0).toUpperCase() + lastPart.slice(1).replace(/-/g, " ")
    );
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-2 border-b border-emerald-900/20 bg-[#050c0a] px-3 sm:px-8">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMobileMenuOpen}
          aria-label="Open navigation menu"
          className="md:hidden p-1.5 rounded-md text-text-secondary hover:bg-bg-elevated"
        >
          <Menu size={20} />
        </button>
        <h1 className="truncate text-base font-bold tracking-tight text-white sm:text-xl">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <NotificationInbox subscriberId={userId} />
        {role === "ADMIN" && <AnnouncementButton />}
        <div className="hidden items-center gap-2 sm:flex">
          <Badge
            variant="outline"
            className="border-emerald-900/40 text-emerald-500 text-[10px] py-0 px-2 uppercase tracking-wider bg-emerald-950/20"
          >
            {termDisplay ?? "—"} {/* ← never undefined */}
          </Badge>
          <div
            className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
            title="Current Session Active"
          />
        </div>
        <button
          type="button"
          onClick={() => signOutAction()}
          className="inline-flex h-9 items-center gap-2 rounded-md px-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-elevated hover:text-danger sm:px-3"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
