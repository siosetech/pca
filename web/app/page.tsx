import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { domains } from "@/lib/data/domains";
import { labServices } from "@/lib/data/services";
import { PASS_RATIO, quizQuestions } from "@/lib/data/quiz";

const endpoints = labServices.filter((s) => s.port && s.url);

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="space-y-6">
        <Badge variant="secondary">Linux Foundation · PCA</Badge>
        <div className="space-y-3">
          <h1 className="max-w-xl text-4xl font-medium tracking-tight text-pretty sm:text-5xl">
            Prometheus Certified Associate
          </h1>
          <p className="max-w-md text-muted-foreground">
            Timed mock, PromQL drills, and a pinned lab — mapped to the official domains.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="lg" nativeButton={false} render={<Link href="/quiz" />}>
            Practice exam
            <ArrowRight data-icon="inline-end" />
          </Button>
          <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/lab" />}>
            Open lab
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-mono tabular-nums text-foreground">{quizQuestions.length}</span> questions
          <span className="mx-2 text-border">·</span>
          <span className="font-mono tabular-nums text-foreground">90 min</span>
          <span className="mx-2 text-border">·</span>
          <span className="font-mono tabular-nums text-foreground">{Math.round(PASS_RATIO * 100)}%</span> to pass
          <span className="mx-2 text-border">·</span>
          <span className="font-mono tabular-nums text-foreground">{domains.length}</span> domains
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-sm font-medium text-muted-foreground">Curriculum</h2>
          <Link
            href="/domains"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            All topics
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {domains.map((d) => (
            <Link key={d.slug} href={`/domains/${d.slug}`}>
              <Card className="h-full transition hover:ring-primary/40">
                <CardHeader>
                  <p className="font-mono text-2xl tabular-nums text-primary">{d.weight}%</p>
                  <CardTitle className="text-sm leading-snug">{d.title}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-sm font-medium text-muted-foreground">Endpoints</h2>
          <Link
            href="/lab"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Setup
          </Link>
        </div>
        <ul className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
          {endpoints.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-4 bg-card px-4 py-2.5 text-sm not-first:border-t not-first:border-border/60"
            >
              <span className="font-medium">{s.name}</span>
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="font-mono tabular-nums text-muted-foreground hover:text-primary"
              >
                :{s.port}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
