"use client";

import { usePathname, useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { getCurrentTermInfo } from "@/app/actions/term-action";
import { Menu } from "lucide-react";

interface TopbarProps {
  onMobileMenuOpen: () => void;
}

export function Topbar({ onMobileMenuOpen }: TopbarProps) {
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
    <header className="h-16 border-b border-emerald-900/20 flex items-center justify-between px-8 bg-[#050c0a] sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMobileMenuOpen}
          className="md:hidden p-1.5 rounded-md text-text-secondary hover:bg-bg-elevated"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-white">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
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
      </div>
    </header>
  );
}
