import Link from "next/link";
import { ArrowRight, Cpu, HardDrive, MemoryStick, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { domains } from "@/lib/data/domains";
import { findings, hardwareNotes } from "@/lib/data/findings";
import { labServices } from "@/lib/data/services";

const severityLabel = {
  keep: "Korunacak",
  fix: "Bu lab’de düzeltildi",
  next: "Sonra",
} as const;

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <Badge variant="secondary">Linux Foundation · PCA</Badge>
        <h1 className="max-w-3xl text-3xl font-medium tracking-tight text-pretty sm:text-4xl">
          Laptop’taki Podman stack’i PCA müfredatına oturuyor. Eksik olan şey
          pin’li config, kurallar ve PromQL pratiğiydi.
        </h1>
        <p className="max-w-2xl text-muted-foreground leading-relaxed">
          MSI i9 / 32 GB, rootful WSL Podman, 8 konteynerlik <code>pca-lab</code>{" "}
          compose. Bu repo aynı servisleri sınav konularıyla eşler: recording /
          alerting rules, Alertmanager grouping, blackbox relabel, Pushgateway,
          histogram SLO kovaları ve 20 soruluk İngilizce deneme.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button nativeButton={false} render={<Link href="/lab" />}>
            Lab’i çalıştır
            <ArrowRight data-icon="inline-end" />
          </Button>
          <Button nativeButton={false} variant="outline" render={<Link href="/quiz" />}>
            Deneme sınavı
          </Button>
          <Button nativeButton={false} variant="ghost" render={<Link href="/promql" />}>
            PromQL (%28)
          </Button>
          <Button nativeButton={false} variant="ghost" render={<Link href="/extras" />}>
            Extras
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card size="sm">
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <Cpu className="size-3.5" /> CPU
            </CardDescription>
            <CardTitle>{hardwareNotes.cpu}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <MemoryStick className="size-3.5" /> Bellek
            </CardDescription>
            <CardTitle>{hardwareNotes.memory}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <HardDrive className="size-3.5" /> Disk
            </CardDescription>
            <CardTitle>{hardwareNotes.disk}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <Server className="size-3.5" /> Motor
            </CardDescription>
            <CardTitle className="text-sm leading-snug">{hardwareNotes.engine}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Mevcut ortamın incelemesi</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {findings.map((f) => (
            <Card key={f.title}>
              <CardHeader>
                <Badge variant={f.severity === "fix" ? "default" : "secondary"}>
                  {severityLabel[f.severity]}
                </Badge>
                <CardTitle>{f.title}</CardTitle>
                <CardDescription className="leading-relaxed">{f.detail}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Sınav ağırlıkları</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {domains.map((d) => (
            <Link key={d.slug} href={`/domains/${d.slug}`}>
              <Card className="h-full transition hover:ring-primary/40">
                <CardHeader>
                  <p className="font-mono text-2xl text-primary">{d.weight}%</p>
                  <CardTitle className="text-sm">{d.title}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Compose servisleri</h2>
        <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Servis</th>
                <th className="px-3 py-2 font-medium">Port</th>
                <th className="px-3 py-2 font-medium">PCA alanı</th>
                <th className="hidden px-3 py-2 font-medium md:table-cell">Rol</th>
              </tr>
            </thead>
            <tbody>
              {labServices.map((s) => (
                <tr key={s.id} className="border-t border-border/60">
                  <td className="px-3 py-2 font-medium">{s.name}</td>
                  <td className="px-3 py-2 font-mono">
                    {s.port ?? "—"}
                  </td>
                  <td className="px-3 py-2">{s.exam}</td>
                  <td className="hidden px-3 py-2 text-muted-foreground md:table-cell">
                    {s.role}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
