// components/report-card/dynamic-signature.tsx
"use client";

import { useMemo } from "react";

// ── Seeded RNG — deterministic per teacher ────────────────────────────────
function seededRng(seed: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
  }
  return () => {
    h ^= h << 13;
    h ^= h >> 7;
    h ^= h << 17;
    return (h >>> 0) / 0xffffffff;
  };
}

const ACCENT_COLORS = [
  "#1e3a5f",
  "#2d4a7a",
  "#1a3a2a",
  "#2e1a4a",
  "#3a1a1a",
  "#1a2e3a",
  "#2a1a3a",
  "#1e2e1a",
];

// ── Signature geometry generator ─────────────────────────────────────────
function buildSignature(seed: string) {
  const rng = seededRng(seed);

  const accentColor = ACCENT_COLORS[Math.floor(rng() * ACCENT_COLORS.length)];
  const monogram = seed
    .split("-")[0]
    .trim()
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

  const W = 160;
  const baseline = 38;
  const segments = 5 + Math.floor(rng() * 4);
  const stepW = W / segments;

  let x = 8;
  const pts: [number, number][] = [[x, baseline]];

  for (let i = 0; i < segments; i++) {
    x += stepW * (0.8 + rng() * 0.4);
    const amp = 10 + rng() * 18;
    pts.push([x, baseline + (rng() > 0.5 ? -amp : amp * 0.5)]);
  }
  pts.push([x + stepW * 0.3, baseline]);

  // Smooth cubic bezier through all points
  let path = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1];
    const [cx, cy] = pts[i];
    const dx = cx - px;
    path +=
      ` C ${px + dx * 0.4 + (rng() - 0.5) * 12},${py + (rng() - 0.5) * 14}` +
      ` ${px + dx * 0.6 + (rng() - 0.5) * 12},${cy + (rng() - 0.5) * 14}` +
      ` ${cx},${cy}`;
  }

  const endX = x + stepW * 0.3;
  const flourish =
    `M ${8 + rng() * 20},${baseline + 4}` +
    ` Q ${(8 + endX) / 2},${baseline + 10 + rng() * 8}` +
    ` ${endX - rng() * 10},${baseline + 4}`;

  return { path, flourish, monogram, accentColor };
}

// ─────────────────────────────────────────────────────────────────────────

interface DynamicSignatureProps {
  teacherName: string;
  teacherId?: string;
  role?: string;
  isApproved?: boolean;
}

export function DynamicSignature({
  teacherName,
  teacherId,
  role = "Form Master",
  isApproved = false,
}: DynamicSignatureProps) {
  const seed = `${teacherName}-${teacherId ?? ""}`;
  const { path, flourish, monogram, accentColor } = useMemo(
    () => buildSignature(seed),
    [seed],
  );

  return (
    <div className="flex flex-col items-start gap-1">
      {/* SVG — scales down for print via viewBox, no fixed px needed */}
      <div
        className={`transition-opacity duration-500 ${
          isApproved ? "opacity-100" : "opacity-30"
        }`}
      >
        <svg
          viewBox="0 0 200 64"
          xmlns="http://www.w3.org/2000/svg"
          className="w-45 h-14 print:w-35 print:h-11 overflow-visible"
        >
          {/* Monogram seal */}
          <circle
            cx="178"
            cy="18"
            r="16"
            fill="none"
            stroke={accentColor}
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.5"
          />
          <text
            x="178"
            y="23"
            textAnchor="middle"
            fill={accentColor}
            fontSize="11"
            fontWeight="700"
            fontFamily="serif"
            opacity="0.7"
          >
            {monogram}
          </text>

          {/* Signature stroke */}
          <path
            d={path}
            fill="none"
            stroke={accentColor}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Flourish underline */}
          <path
            d={flourish}
            fill="none"
            stroke={accentColor}
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* VERIFIED stamp — only when approved */}
          {isApproved && (
            <g transform="translate(148, 38)">
              <rect
                x="0"
                y="0"
                width="44"
                height="14"
                rx="2"
                fill="none"
                stroke={accentColor}
                strokeWidth="0.7"
                opacity="0.5"
              />
              <text
                x="22"
                y="10"
                textAnchor="middle"
                fill={accentColor}
                fontSize="7"
                fontWeight="600"
                fontFamily="monospace"
                letterSpacing="1"
                opacity="0.7"
              >
                VERIFIED
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Labels */}
      <div className="space-y-0.5">
        <p className="text-[11px] print:text-[9px] font-black uppercase tracking-widest text-slate-800">
          {teacherName}
        </p>
        <p className="text-[10px] print:text-[8px] text-slate-400 uppercase tracking-widest font-medium">
          {role}
        </p>
        {teacherId && (
          <p className="text-[9px] print:text-[7px] text-slate-300 font-mono tracking-wider">
            ID: {teacherId}
          </p>
        )}
      </div>
    </div>
  );
}
