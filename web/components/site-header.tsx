import Link from "next/link";
import { Activity } from "lucide-react";

const links = [
  { href: "/", label: "Overview" },
  { href: "/lab", label: "Lab" },
  { href: "/domains", label: "Curriculum" },
  { href: "/promql", label: "PromQL" },
  { href: "/quiz", label: "Quiz" },
  { href: "/cheatsheet", label: "Cheatsheet" },
  { href: "/extras", label: "Extras" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-medium">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="size-4" />
          </span>
          <span className="hidden sm:inline">PCA Lab</span>
        </Link>
        <nav className="flex items-center gap-0.5 overflow-x-auto text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-2.5 py-1.5 text-muted-foreground whitespace-nowrap hover:bg-muted hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
        <p>Linux Foundation PCA study lab — not official exam material.</p>
        <p>Exam is in English, 90 minutes, multiple choice.</p>
      </div>
    </footer>
  );
}
