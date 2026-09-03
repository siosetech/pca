"use client";

import { useState } from "react";
import { CopyBlock } from "@/components/copy-block";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { exercises } from "@/lib/data/promql";

export function PromqlList() {
  const [open, setOpen] = useState<string | null>(exercises[0]?.id ?? null);

  return (
    <div className="space-y-3">
      {exercises.map((ex, i) => {
        const isOpen = open === ex.id;
        return (
          <Card key={ex.id}>
            <CardHeader>
              <CardTitle className="flex items-baseline gap-2">
                <span className="font-mono text-xs text-primary">{String(i + 1).padStart(2, "0")}</span>
                {ex.title}
              </CardTitle>
              <CardDescription>{ex.goal}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                İpucu: {ex.hint}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOpen(isOpen ? null : ex.id)}
              >
                {isOpen ? "Sorguyu gizle" : "Sorguyu göster"}
              </Button>
              {isOpen ? (
                <div className="space-y-2">
                  <CopyBlock code={ex.query} />
                  <p className="text-sm leading-relaxed">{ex.notes}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
