"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { ToastHost } from "./toast-host";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/prompts", label: "Prompts" },
  { href: "/scratchpad", label: "Scratchpad" }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="h-14 px-6 flex items-center justify-between border-b bg-white">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-slate-900" />
          <div>
            <div className="font-semibold">Prompt Manager — New IA</div>
            <div className="text-xs text-slate-500">Checkpoint 3 / dev-only routes</div>
          </div>
        </div>
        <nav className="flex items-center gap-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "px-3 py-2 rounded-full text-sm border transition-colors " +
                  (active ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 hover:bg-slate-50")
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {children}
      </main>

      <ToastHost />
    </div>
  );
}
