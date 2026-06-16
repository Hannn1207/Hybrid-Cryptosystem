"use client";

import Link from "next/link";

interface QuickActionLinkProps {
  href: string;
  label: string;
  desc: string;
  iconBg: string;
  iconColor: string;
  icon: string;
}

export default function QuickActionLink({ href, label, desc, iconBg, iconColor, icon }: QuickActionLinkProps) {
  return (
    <Link
      href={href}
      className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all duration-200 group"
      style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-elevated)";
      }}
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: iconBg, color: iconColor }}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
          {label}
        </p>
        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--text-muted)" }}>
          {desc}
        </p>
      </div>
      <svg
        className="w-4 h-4 flex-shrink-0 group-hover:translate-x-1 transition-transform"
        style={{ color: "var(--text-muted)" }}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
