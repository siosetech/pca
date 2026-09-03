"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyBlock({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={cn("group relative", className)}>
      <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-[13px] leading-relaxed">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute top-2 right-2 rounded-md border border-border bg-background/80 p-1.5 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-foreground"
        aria-label="Copy"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  );
}
