import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { domains } from "@/lib/data/domains";

export default function DomainsPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-medium tracking-tight">Curriculum</h1>
        <p className="text-muted-foreground">Official domains. PromQL is 28%.</p>
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        {domains.map((d) => (
          <Link key={d.slug} href={`/domains/${d.slug}`}>
            <Card className="h-full transition hover:ring-primary/40">
              <CardHeader>
                <p className="font-mono text-sm tabular-nums text-primary">{d.weight}%</p>
                <CardTitle>{d.title}</CardTitle>
                <CardDescription>{d.subtitle}</CardDescription>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {d.topics.map((t) => (
                    <li
                      key={t}
                      className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
