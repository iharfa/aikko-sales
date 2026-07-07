"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Sell", d: "M3 3h2l2 12h10l2-8H7" },
  { href: "/inventory", label: "Stock", d: "M4 7l8-4 8 4v10l-8 4-8-4V7m8-4v18M4 7l8 4 8-4" },
  { href: "/sales", label: "Sales", d: "M5 3v18h14M9 8h6M9 12h6M9 16h4" },
  { href: "/stats", label: "Stats", d: "M4 20V10m6 10V4m6 16v-7m4 7H2" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg">
        {TABS.map((t) => {
          const active = path === t.href;
          return (
            <Link key={t.href} href={t.href} aria-current={active ? "page" : undefined}
              className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs ${active ? "font-semibold text-accent" : "text-muted"}`}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={t.d} />
              </svg>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
