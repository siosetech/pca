import { CopyBlock } from "@/components/copy-block";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { labServices } from "@/lib/data/services";

export default function LabPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-medium">Lab — Podman Compose</h1>
        <p className="max-w-2xl text-muted-foreground leading-relaxed">
          Windows + Podman Desktop. Compose <code>lab\compose.yaml</code>{" "}
          içinde. Grafana 3000, Prometheus 9090 — mevcut portlarınla aynı.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Başlat</CardTitle>
          <CardDescription>
            Rootful Podman machine RUNNING olmalı (Settings → Resources).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <CopyBlock
            code={`cd D:\\dev\\workspace\\pca\\lab
podman compose up -d --build`}
          />
          <p className="text-sm text-muted-foreground">
            İlk açılışta imaj çekimi ve sample-app build birkaç dakika sürebilir.
            Eski stack’i durdur:{" "}
            <code>podman compose down</code> (lab dizininden) — port çakışmasın.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {labServices.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>{s.name}</CardTitle>
                {s.port ? (
                  <Badge variant="secondary" className="font-mono">
                    :{s.port}
                  </Badge>
                ) : (
                  <Badge variant="outline">internal</Badge>
                )}
              </div>
              <CardDescription>{s.image}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{s.role}</p>
              <p className="text-muted-foreground">{s.exam}</p>
              {s.url ? (
                <a
                  className="text-primary underline-offset-4 hover:underline"
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {s.url}
                </a>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sınav turu (30 dk)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Prometheus → Status → Targets: hepsi UP. file-sd ve blackbox-http
              job’larını aç, relabel sonucunu gör.
            </li>
            <li>
              Graph’ta <code>rate(http_requests_total[5m])</code> ve{" "}
              <code>job:http_request_error_ratio:rate5m</code> (recording).
            </li>
            <li>
              Alerts: HighErrorRate pending/firing — /api/unstable kasıtlı %28
              500.
            </li>
            <li>
              Alertmanager: group_by, inhibit. sample-app{" "}
              <code>alertmanager_webhooks_total</code> artmalı.
            </li>
            <li>
              Grafana <code>admin / pca</code> — PCA Lab Overview. Heatmap değil
              timeseries; p99 histogram_quantile.
            </li>
            <li>
              Pushgateway UI ve{" "}
              <code>time() - timestamp(batch_job_last_success_timestamp_seconds)</code>.
            </li>
            <li>
              Config reload:{" "}
              <code>curl -X POST http://localhost:9090/-/reload</code>{" "}
              (--web.enable-lifecycle).
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kind (opsiyonel)</CardTitle>
          <CardDescription>
            kubernetes_sd_configs pratikleri. Compose yeter; Kind ikinci adım.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CopyBlock
            code={`$env:KIND_EXPERIMENTAL_PROVIDER = "podman"
kind create cluster --config k8s/kind-cluster.yaml`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
