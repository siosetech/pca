"use client";

import { useState, type ReactNode } from "react";
import { CopyBlock } from "@/components/copy-block";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { drillSets } from "@/lib/data/drills";
import { exercises } from "@/lib/data/promql";
import { cn } from "@/lib/utils";

function RichText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("`")) {
      parts.push(
        <code key={k++} className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-primary">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**")) {
      parts.push(
        <strong key={k++} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    }
    last = m.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <span className="leading-relaxed whitespace-pre-wrap">{parts}</span>;
}

export function PromqlList() {
  const [activeTab, setActiveTab] = useState<string>("patterns");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "patterns-up": true,
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = (ids: string[]) => {
    setOpenItems((prev) => {
      const next = { ...prev };
      ids.forEach((id) => (next[id] = true));
      return next;
    });
  };

  const collapseAll = (ids: string[]) => {
    setOpenItems((prev) => {
      const next = { ...prev };
      ids.forEach((id) => (next[id] = false));
      return next;
    });
  };

  const activeDrill = drillSets.find((d) => d.id === activeTab);

  return (
    <div className="space-y-6">
      {/* Navigation tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border/80 pb-3">
        <button
          onClick={() => setActiveTab("patterns")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition",
            activeTab === "patterns"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <span>Patterns</span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-xs font-mono",
              activeTab === "patterns"
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {exercises.length}
          </span>
        </button>

        {drillSets.map((drill) => {
          const isActive = activeTab === drill.id;
          return (
            <button
              key={drill.id}
              onClick={() => setActiveTab(drill.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span>{drill.shortTitle}</span>
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-xs font-mono",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {drill.items.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Common Patterns View */}
      {activeTab === "patterns" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Essential query patterns commonly asked on the PCA exam. Run them in the lab.
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => expandAll(exercises.map((e) => `patterns-${e.id}`))}
              >
                Expand all
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => collapseAll(exercises.map((e) => `patterns-${e.id}`))}
              >
                Collapse all
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {exercises.map((ex, i) => {
              const key = `patterns-${ex.id}`;
              const isOpen = !!openItems[key];
              return (
                <Card key={ex.id}>
                  <CardHeader>
                    <CardTitle className="flex items-baseline gap-2">
                      <span className="font-mono text-xs text-primary">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {ex.title}
                    </CardTitle>
                    <CardDescription>{ex.goal}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">Hint: {ex.hint}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleItem(key)}
                    >
                      {isOpen ? "Hide query" : "Show query"}
                    </Button>
                    {isOpen ? (
                      <div className="space-y-2 pt-1">
                        <CopyBlock code={ex.query} />
                        <p className="text-sm leading-relaxed">{ex.notes}</p>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Drill Set View */}
      {activeDrill ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-medium">{activeDrill.title}</h2>
              <p className="text-xs text-muted-foreground">
                Write your query in the lab first, then reveal the answer.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => expandAll(activeDrill.items.map((it) => `drill-${it.id}`))}
              >
                Expand all
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => collapseAll(activeDrill.items.map((it) => `drill-${it.id}`))}
              >
                Collapse all
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {activeDrill.items.map((item) => {
              const key = `drill-${item.id}`;
              const isOpen = !!openItems[key];
              return (
                <Card key={item.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-start gap-2.5 text-base font-normal">
                      <Badge variant="outline" className="font-mono text-xs font-medium">
                        #{item.num}
                      </Badge>
                      <div className="flex-1">
                        <RichText text={item.prompt} />
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleItem(key)}
                    >
                      {isOpen ? "Hide answer" : "Show answer"}
                    </Button>
                    {isOpen ? (
                      <div className="space-y-2 rounded-lg border border-border/80 bg-muted/40 p-3">
                        {item.query ? (
                          <div className="space-y-1">
                            <p className="font-mono text-xs text-muted-foreground">Answer Query:</p>
                            <CopyBlock code={item.query} />
                          </div>
                        ) : null}
                        {item.explanation ? (
                          <div className="text-sm leading-relaxed text-muted-foreground">
                            <RichText text={item.explanation} />
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
